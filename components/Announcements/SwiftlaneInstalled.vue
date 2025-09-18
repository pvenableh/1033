<template>
  <div v-if="email" class="max-w-2xl mx-auto bg-white">
    <!-- Installation Complete Hero -->
    <div
      class="my-8 bg-cover bg-center bg-no-repeat h-[200px] flex items-center justify-center bg-blend-darken bg-[rgba(0,0,0,0.5)] text-white"
      style="
        background-image: url('https://admin.1033lenox.com/assets/aefbb2a4-cc01-460d-a79b-2a627e80df38?key=large-png');
      "
    >
      <p style="text-transform: uppercase; margin-top: 0px; letter-spacing: 0.05em; font-size: 28px; line-height: 30px">
        Installation Complete 🔥🚀
      </p>
    </div>

    <!-- Main Content -->
    <div class="px-0 mb-8">
      <p class="text-left text-gray-600 max-w-[500px] mx-auto text-lg leading-relaxed">
        The Swiftlane Intercom has been successfully installed! 📱
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        We have residents already signed up but wanted to send a few reminders:
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        You need to
        <strong>setup your Swiftlane account</strong>
        and
        <strong>install the app</strong>
        -
        <a href="https://apps.apple.com/us/app/swiftlane-id/id1465204078" style="color: #3a1deb; font-weight: bold">
          Apple
        </a>
        or
        <a
          href="https://play.google.com/store/apps/details?id=com.swiftlane.employee"
          style="color: #3a1deb; font-weight: bold"
        >
          Google
        </a>
        store - to use the new access panel (instructions are below).
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        This will allow you to receive calls from the directory, allow access remotely, manage PINs for delivery, and
        setup your preferences for facial recognition, Siri, and more.
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        Each user is assigned a PIN for access when your account is created.
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        The panel is using the Amazon Key system for Amazon deliveries. That should work for Amazon as before. If you
        experience any issues, please let the Board know.
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        USPS has access. Other delivery methods will need a PIN that you provide in your delivery instructions. They can
        also call you from the directory for access.
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        Please note, this is
        <strong>new for all of us</strong>
        , and we appreciate everyone's patience and feedback as we work out any issues. 🙏🙏🙏
      </p>

      <p class="text-left text-gray-600 mb-6 max-w-[500px] mx-auto leading-relaxed italic">
        **Invites were sent out yesterday to each owner and active tenant. If you did not receive an invite from
        Swiftlane (verification@swiftlane.com) let the board know and it will be resent.**
      </p>
    </div>

    <!-- App Links Section -->
    <div class="px-0 mb-8">
      <h3 class="text-center text-2xl font-bold uppercase tracking-wide text-gray-700 mb-6">Swiftlane Links</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Apple Store -->
        <div class="text-center">
          <a href="https://apps.apple.com/us/app/swiftlane-id/id1465204078" target="_blank">
            <img
              src="https://admin.1033lenox.com/assets/0785f18e-de67-43d6-ae69-3127d55d6ddc"
              alt="Download on App Store"
              class="mx-auto w-32"
            />
          </a>
        </div>

        <!-- Google Play -->
        <div class="text-center">
          <a href="https://play.google.com/store/apps/details?id=com.swiftlane.employee" target="_blank">
            <img
              src="https://admin.1033lenox.com/assets/187e19fb-d808-4789-9909-e5bf55fa4374"
              alt="Get it on Google Play"
              class="mx-auto w-32"
            />
          </a>
        </div>

        <!-- Video Instructions -->
        <div class="text-center">
          <a href="https://www.youtube.com/watch?v=y9uaGc9V0RQ" target="_blank">
            <img
              src="https://admin.1033lenox.com/assets/70e32a52-4553-483e-bed3-2983be75ed6b"
              alt="Video Instructions"
              class="mx-auto w-20 mb-2"
            />
            <div class="text-xs uppercase font-bold text-[#3A1DEB] tracking-wide">Video Instructions</div>
          </a>
        </div>

        <!-- PDF Instructions -->
        <div class="text-center">
          <a href="https://admin.1033lenox.com/assets/ea67a298-9c7c-49a7-8843-3983ac11d302" target="_blank">
            <img
              src="https://admin.1033lenox.com/assets/76fc96c1-69ed-4d6c-b047-3ee11baa4d5c"
              alt="PDF Instructions"
              class="mx-auto w-20 mb-2"
            />
            <div class="text-xs uppercase font-bold text-[#3A1DEB] tracking-wide">PDF Instructions</div>
          </a>
        </div>
      </div>
    </div>

    <!-- Free Trial Section -->
    <div class="bg-[#3A1DEB] text-white py-8 px-6 md:p-8 mb-8">
      <h3 class="text-center text-2xl font-bold uppercase tracking-[0.04em]">
        Facial Recognition +
        <br />
        Passcodes
        <span class="text-[var(--green)] text-shadow">Free Trial</span>
      </h3>
      <div class="text-left mx-auto leading-relaxed max-w-[450px]">
        <p>Every user has a free 30-day trial to use the facial recognition and visitor passes features.</p>
        <p>
          After that, each user can choose to subscribe to $21.99/year per user. This is not required for PIN and mobile
          app access.
        </p>
      </div>
    </div>

    <!-- Setup Instructions -->
    <div class="px-0 mb-8">
      <h3 class="text-center uppercase font-bold text-gray-700 text-lg">Setting up the Swiftlane App</h3>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto leading-relaxed">
        Please note, active tenants and owners will all receive an invitation. Owners who don't live here will not be
        listed on the directory, but will have Swiftlane access.
      </p>

      <p class="text-left text-gray-600 max-w-[500px] mx-auto">📋Here is a simple list of steps to get started:</p>

      <ol class="ml-24 text-sm text-gray-700 space-y-1 max-w-md mx-auto leading-relaxed list-decimal">
        <li>
          You will receive an email invite from Swiftlane (verification@swiftlane.com) to
          {{ email.email || 'your email' }}
        </li>
        <li>
          Note the workspace and email in the invite:
          <ul class="ml-4 mt-1 space-y-1 list-disc">
            <li>
              Workspace:
              <strong>1033lenox</strong>
            </li>
            <li>
              Email:
              <strong>{{ email.email || 'your email' }}</strong>
            </li>
          </ul>
        </li>
        <li>
          Download the Swiftlane app from the
          <a href="https://apps.apple.com/us/app/swiftlane-id/id1465204078" style="color: #3a1deb; font-weight: bold">
            Apple
          </a>
          or
          <a
            href="https://play.google.com/store/apps/details?id=com.swiftlane.employee"
            style="color: #3a1deb; font-weight: bold"
          >
            Google
          </a>
          store
        </li>
        <li>
          Enter the workspace name:
          <strong>1033lenox</strong>
        </li>
        <li>
          Enter the email from the invite:
          <strong>{{ email.email || 'your email' }}</strong>
        </li>
        <li>Check your email for verification code</li>
        <li>Enter verification code in the app</li>
        <li>Review and accept terms and policies</li>
        <li>
          <span class="text-green-600 font-bold text-xs">[OPTIONAL]</span>
          Setup Face ID if you want
        </li>
        <li>
          <span class="text-green-600 font-bold text-xs">[OPTIONAL]</span>
          Enable bluetooth and camera [for video intercom calls]
        </li>
      </ol>

      <p class="text-left text-gray-600 text-sm mt-6 max-w-[500px] mx-auto leading-relaxed">
        Each user can choose to be called via phone number [with no video intercom calls] or via the app [enables video
        intercom calls].
      </p>

      <p class="text-left text-gray-600 text-sm mt-4 max-w-[500px] mx-auto leading-relaxed">
        Please note, active tenants and owners will all receive an invitation. Owners who don't live here will not be
        listed on the directory, but will have Swiftlane access.
      </p>
    </div>

    <!-- Instructions Preview -->
    <div class="px-0 mb-6">
      <div class="border-2 border-[#3A1DEB] rounded-sm p-4">
        <a href="https://admin.1033lenox.com/assets/ea67a298-9c7c-49a7-8843-3983ac11d302" target="_blank">
          <img
            src="https://admin.1033lenox.com/assets/f8aa337f-dbd7-4436-b487-b1f45e19f187?key=large-png"
            alt="Setup Instructions Preview"
            class="w-full"
          />
        </a>
      </div>
    </div>

    <!-- Thank You Message -->
    <div class="px-0 py-0 mb-0">
      <div class="text-sm text-gray-600 leading-relaxed">
        <div class="text-base leading-5" v-html="email.content"></div>
        <p>
          Again, we want to thank you for your patience as we work together in enhancing the security of 1033 Lenox.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  email: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
/* Custom styles for responsive design */
@media (max-width: 640px) {
  .grid-cols-1.md\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* Ensure proper link styling */
a {
  color: #3a1deb;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
