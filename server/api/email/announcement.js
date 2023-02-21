import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const message = {
        personalizations: [{
            to: [{
                email: 'peter@huestudios.com',
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
            email: 'mail@1033lenox.com',
            name: '1033 Lenox'
        },
        subject: 'Attention Peter: ',
        content: [{
            type: 'text/html',
            value: '&nbsp;'
        }],
        dynamicTemplateData: {
            first_name: body.first_name,
            unit: body.unit,
            title: body.title,
            subtitle: body.subtitle,
            urgent: body.urgent,
            content: body.content,
        },
        categories: [
            'announcements'
        ],
    }

sgMail.send(message).then(() => {}, error => {
    
    console.error(error)
    if (error.response) {
      console.error(error.response.body)
      const error = error.response.body

    }
  })
  return body
})