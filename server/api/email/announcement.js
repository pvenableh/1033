import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');
const array1 = [
    {
        first_name: "Peter",
        unit: "312",
        email: "peter@huestudios.com"
    },
    {
        first_name: "Oscar",
        unit: "214",
        email: "petervhoffman@gmail.com"
    },
    {
        first_name: "Test",
        unit: "201",
        email: "contact@huestudios.com"
    }
]
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    // const announcement = await $fetch(`https://admin.1033lenox.com/items/announcements/${body.payload.id}`)
   
    const messages = []
    array1.forEach(element => {
        messages.push(
            {
                personalizations: [{
                    to: [{
                        email: element.email,
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
                subject: 'Attention ' + element.first_name + ': ' + body.payload.title,
                content: [{
                    type: 'text/html',
                    value: '&nbsp;'
                }],
                dynamicTemplateData: {
                    first_name: element.first_name,
                    unit: element.unit,
                    title: body.payload.title,
                    subtitle: body.payload.subtitle,
                    urgent: body.payload.urgent,
                    content: body.payload.content,
                    // content: announcement,
                },
                categories: [
                    'announcements'
                ],
            }
        )
    })
 

    sgMail.send(messages).then(() => {}, error => {
        console.error(error)
        if (error.response) {
        console.error(error.response.body)
        const error = error.response.body

        }
    })
  return body.payload
})