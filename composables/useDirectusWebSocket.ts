/**
 * useDirectusWebSocket composable
 *
 * A robust WebSocket-based realtime subscription composable for Directus.
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Multiple subscriptions support
 * - Proper cleanup on unmount
 * - Error handling and events
 * - Fetches token from server endpoint for secure authentication
 */

export interface SubscriptionQuery {
  fields?: string[];
  filter?: Record<string, any>;
  sort?: string | string[];
  limit?: number;
}

export interface SubscriptionOptions {
  collection: string;
  query?: SubscriptionQuery;
  uid?: string; // Unique identifier for this subscription
}

export interface SubscriptionEvent<T = any> {
  type: 'init' | 'create' | 'update' | 'delete';
  data: T[];
}

export type SubscriptionCallback<T = any> = (event: SubscriptionEvent<T>) => void;

interface Subscription {
  collection: string;
  query: SubscriptionQuery;
  uid: string;
  callback: SubscriptionCallback;
}

// Singleton connection manager
let globalConnection: WebSocket | null = null;
let globalConnectionPromise: Promise<WebSocket> | null = null;
let globalToken: string | null = null;
const globalSubscriptions = new Map<string, Subscription>();
const globalListeners = new Set<(event: SubscriptionEvent) => void>();

export function useDirectusWebSocket() {
  const config = useRuntimeConfig();

  /**
   * Fetch WebSocket token from server
   */
  async function fetchToken(): Promise<string> {
    if (globalToken) {
      return globalToken;
    }

    try {
      const response = await $fetch<{ token: string }>('/api/websocket/token');
      globalToken = response.token;
      return response.token;
    } catch (error) {
      console.error('Failed to fetch WebSocket token:', error);
      throw new Error('Failed to authenticate for WebSocket connection');
    }
  }

  // Reactive state
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);

  // Configuration
  const MAX_RECONNECT_ATTEMPTS = 10;
  const INITIAL_RECONNECT_DELAY = 1000;
  const MAX_RECONNECT_DELAY = 30000;

  /**
   * Get or create the WebSocket connection
   */
  async function getConnection(): Promise<WebSocket> {
    if (globalConnection?.readyState === WebSocket.OPEN) {
      return globalConnection;
    }

    if (globalConnectionPromise) {
      return globalConnectionPromise;
    }

    globalConnectionPromise = createConnection();
    return globalConnectionPromise;
  }

  /**
   * Create a new WebSocket connection
   */
  function createConnection(): Promise<WebSocket> {
    return new Promise(async (resolve, reject) => {
      isConnecting.value = true;
      connectionError.value = null;

      // Fetch token first
      let token: string;
      try {
        token = await fetchToken();
      } catch (error) {
        isConnecting.value = false;
        connectionError.value = 'Failed to get authentication token';
        reject(error);
        return;
      }

      const wsUrl = config.public.websocketUrl;
      const connection = new WebSocket(wsUrl);

      connection.addEventListener('open', () => {
        isConnecting.value = false;
        isConnected.value = true;
        reconnectAttempts.value = 0;

        // Authenticate with fetched token
        connection.send(JSON.stringify({
          type: 'auth',
          access_token: token,
        }));
      });

      connection.addEventListener('message', (event) => {
        handleMessage(connection, event);
      });

      connection.addEventListener('close', (event) => {
        isConnected.value = false;
        globalConnection = null;
        globalConnectionPromise = null;

        if (!event.wasClean) {
          scheduleReconnect();
        }
      });

      connection.addEventListener('error', (error) => {
        isConnecting.value = false;
        connectionError.value = 'WebSocket connection error';
        console.error('WebSocket error:', error);
        reject(error);
      });

      // Wait for auth confirmation
      const authHandler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth') {
          connection.removeEventListener('message', authHandler);
          if (data.status === 'ok') {
            globalConnection = connection;
            resolve(connection);
            // Resubscribe to all existing subscriptions
            resubscribeAll(connection);
          } else {
            connectionError.value = 'Authentication failed';
            reject(new Error('Authentication failed'));
          }
        }
      };

      connection.addEventListener('message', authHandler);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  function handleMessage(connection: WebSocket, event: MessageEvent) {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'ping':
        connection.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'subscription':
        handleSubscriptionEvent(data);
        break;

      case 'error':
        console.error('Directus WebSocket error:', data.error);
        connectionError.value = data.error?.message || 'Unknown error';
        break;
    }
  }

  /**
   * Handle subscription events
   */
  function handleSubscriptionEvent(data: any) {
    const subscriptionEvent: SubscriptionEvent = {
      type: data.event,
      data: data.data || [],
    };

    // Find matching subscription by UID
    if (data.uid) {
      const subscription = globalSubscriptions.get(data.uid);
      if (subscription) {
        subscription.callback(subscriptionEvent);
      }
    }

    // Notify global listeners
    globalListeners.forEach(listener => listener(subscriptionEvent));
  }

  /**
   * Resubscribe to all existing subscriptions after reconnection
   */
  function resubscribeAll(connection: WebSocket) {
    globalSubscriptions.forEach((subscription) => {
      sendSubscription(connection, subscription);
    });
  }

  /**
   * Send a subscription request
   */
  function sendSubscription(connection: WebSocket, subscription: Subscription) {
    connection.send(JSON.stringify({
      type: 'subscribe',
      collection: subscription.collection,
      query: subscription.query,
      uid: subscription.uid,
    }));
  }

  /**
   * Schedule a reconnection attempt
   */
  function scheduleReconnect() {
    if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
      connectionError.value = 'Max reconnection attempts reached';
      return;
    }

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.value),
      MAX_RECONNECT_DELAY
    );

    reconnectAttempts.value++;

    setTimeout(() => {
      if (!isConnected.value && !isConnecting.value) {
        getConnection().catch(console.error);
      }
    }, delay);
  }

  /**
   * Subscribe to a collection
   */
  async function subscribe<T = any>(
    options: SubscriptionOptions,
    callback: SubscriptionCallback<T>
  ): Promise<() => void> {
    const uid = options.uid || `${options.collection}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subscription: Subscription = {
      collection: options.collection,
      query: options.query || {},
      uid,
      callback: callback as SubscriptionCallback,
    };

    globalSubscriptions.set(uid, subscription);

    try {
      const connection = await getConnection();
      sendSubscription(connection, subscription);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }

    // Return unsubscribe function
    return () => {
      unsubscribe(uid);
    };
  }

  /**
   * Unsubscribe from a subscription
   */
  async function unsubscribe(uid: string) {
    globalSubscriptions.delete(uid);

    if (globalConnection?.readyState === WebSocket.OPEN) {
      globalConnection.send(JSON.stringify({
        type: 'unsubscribe',
        uid,
      }));
    }
  }

  /**
   * Subscribe to a collection with reactive data
   */
  function useSubscription<T = any>(options: SubscriptionOptions) {
    const data = ref<T[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    let unsubscribeFn: (() => void) | null = null;

    const handleEvent = (event: SubscriptionEvent<T>) => {
      switch (event.type) {
        case 'init':
          data.value = event.data;
          loading.value = false;
          break;

        case 'create':
          data.value = [...data.value, ...event.data];
          break;

        case 'update':
          data.value = data.value.map(item => {
            const updated = event.data.find((u: any) => u.id === (item as any).id);
            return updated || item;
          });
          break;

        case 'delete':
          const deletedIds = event.data.map((d: any) => d.id);
          data.value = data.value.filter((item: any) => !deletedIds.includes(item.id));
          break;
      }
    };

    onMounted(async () => {
      try {
        unsubscribeFn = await subscribe(options, handleEvent);
      } catch (e: any) {
        error.value = e.message;
        loading.value = false;
      }
    });

    onUnmounted(() => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    });

    return {
      data,
      loading,
      error,
    };
  }

  /**
   * Disconnect the WebSocket
   */
  function disconnect() {
    if (globalConnection) {
      globalConnection.close(1000, 'Client disconnecting');
      globalConnection = null;
      globalConnectionPromise = null;
    }
    isConnected.value = false;
    globalSubscriptions.clear();
  }

  /**
   * Force reconnect
   */
  async function reconnect() {
    disconnect();
    reconnectAttempts.value = 0;
    return getConnection();
  }

  return {
    // State
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,

    // Methods
    subscribe,
    unsubscribe,
    useSubscription,
    disconnect,
    reconnect,
    getConnection,
  };
}

/**
 * Helper composable for subscribing to tasks
 */
export function useTasksSubscription() {
  const { useSubscription } = useDirectusWebSocket();

  return useSubscription({
    collection: 'tasks',
    query: {
      fields: [
        '*',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_updated.id',
        'user_updated.first_name',
        'user_updated.last_name',
        'files.*',
        'assigned_to.directus_users_id.id',
        'assigned_to.directus_users_id.first_name',
        'assigned_to.directus_users_id.last_name',
      ],
      sort: 'date_created',
    },
    uid: 'tasks-main',
  });
}

/**
 * Helper composable for subscribing to comments
 */
export function useCommentsSubscription(taskId: string | Ref<string>) {
  const { useSubscription } = useDirectusWebSocket();
  const id = isRef(taskId) ? taskId.value : taskId;

  return useSubscription({
    collection: 'tasks_comments',
    query: {
      fields: [
        'comments_id.*',
        'comments_id.user.id',
        'comments_id.user.first_name',
        'comments_id.user.last_name',
        'comments_id.user.avatar',
        'comments_id.user.email',
      ],
      filter: {
        tasks_id: { _eq: id },
        comments_id: { comment: { _nnull: true } },
      },
      sort: '-comments_id.date_created',
    },
    uid: `comments-${id}`,
  });
}
