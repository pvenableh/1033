import sendgrid from '@sendgrid/mail';
sendgrid.setApiKey('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');

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const message = {
        personalizations: [{
            to: [{
                email: query.email,
            }],

            bcc: [{
                email: 'huestudios.com@gmail.com'
            }],
        }],
        from: {
            email: 'mail@1033lenox.com',
            name: '1033 Lenox'
        },
        template_id: 'd-1022730d92cd42dead4b9d639ed955fc',
        replyTo: {
            email: 'mail@1033lenox.com',
            name: '1033 Lenox'
        },
        subject: 'Welcome to 1033 Lenox',
        content: [{
            type: 'text/html',
            value: '&nbsp;'
        }],
        dynamicTemplateData: {
            email: query.email,
            first_name: query.first_name
        },
        categories: [
            '1033 Lenox', 'registrations'
        ],
    };

    sendgrid.send(message)
        .then(() => console.log('Mail sent successfully'))
        .catch(error => {
            console.error(error);
        });
})