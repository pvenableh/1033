import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey('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');
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const message = {
        personalizations: [{
            to: [{
                email: body.email,
            }],
            bcc: [{
                email: 'huestudios.com@gmail.com',
            }
        }],
        from: {
            email: 'mail@1033lenox.com',
            name: '1033 Lenox'
        },

        template_id: 'd-035e7712976d45aaa5143d8a1042aee7',
        replyTo: {
            email: 'mail@1033lenox.com',
            name: '1033 Lenox'
        },
        subject: 'Attention ' + body.first_name + ': ' + body.title',
        content: [{
            type: 'text/html',
            value: '&nbsp;'
        }],
        dynamicTemplateData: {
            email: body.email,
            first_name: body.first_name,
            unit: body.unit,
            content: body.content,
            title: body.title,
            subtitle: body.subtitle,
            urgent: body.urgent,
        },
        categories: [
            'announcements'
        ],
    };
    sendgrid.send(message)
        .then((res) => console.log(res))
        .catch(error => {
            console.error(error);
        });
    return
})