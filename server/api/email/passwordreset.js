import sendgrid from '@sendgrid/mail';
import {
    Buffer
} from 'buffer'
sendgrid.setApiKey('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');

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const encoded_email = Buffer.from(query.email).toString('base64');
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
        template_id: 'd-ae769660ef18488487809467997242f4',
        replyTo: {
            email: 'lenoxplazaboard@gmail.com',
            name: 'Lenox Plaza Board'
        },
        subject: 'Password Reset for 1033lenox.com',
        content: [{
            type: 'text/html',
            value: '&nbsp;'
        }],
        dynamicTemplateData: {
            user_email: query.email,
            email: encoded_email
        },
        categories: [
            '1033 Lenox'
        ],
    };

    sendgrid.send(message)
        .then(() => console.log('Mail sent successfully'))
        .catch(error => {
            console.error(error);
        });
})