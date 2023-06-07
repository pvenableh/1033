import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const recipients = body.data.recipients
    const messages = []
    recipients.forEach(element => {
        if (element.people_id.email && element.people_id.unit.length > 0) {
            messages.push(
                {
                    personalizations: [{
                        to: [{
                            email: element.people_id.email,
                        }],
                        bcc: [{
                            email: 'huestudios.com@gmail.com',
                        }]
                    }],
                    from: {
                        email: 'mail@1033lenox.com',
                        name: '1033 Lenox'
                    },
                    template_id: 'd-035e7712976d45aaa5143d8a1042aee7',
                    replyTo: {
                        email: 'lenoxplazaboard@gmail.com',
                        name: '1033 Lenox'
                    },
                    subject: 'Attention ' + element.people_id.first_name + ': ' + body.data.data.title,
                    content: [{
                        type: 'text/html',
                        value: '&nbsp;'
                    }],
                    dynamicTemplateData: {
                        first_name: element.people_id.first_name,
                        unit: element.people_id.unit[0].units_id.number,
                        title: body.data.data.title,
                        subtitle: body.data.data.subtitle,
                        urgent: body.data.data.urgent,
                        content: body.data.data.content,
                        url: body.data.data.url,
                    },
                    categories: [
                        '1033 Lenox', 'announcements'
                    ],
                }
            )
        }
    })
 

    sgMail.send(messages).then(() => {}, error => {
        console.error(error)
        if (error.response) {
            console.error(error.response.body)
            const error = error.response.body
        }
  })
})