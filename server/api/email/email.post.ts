
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event)

    const recipients = body.data.recipients
    const messages = []
    if(recipients.length > 0) {
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
                    closing: body.data.data.closing,
                },
                categories: [
                    '1033 Lenox', 'announcements'
                ],
            }
          )
        }
      })
    }
    console.log(messages)
    const message = {
        personalizations: [
          {
            to: [
              {
                email: 'contact@huestudios.com',
              },
            ],
    
            bcc: [
              {
                email: 'huestudios.com@gmail.com',
              },
            ],
          },
        ],
        from: {
          email: 'mail@1033lenox.com',
          name: '1033 Lenox',
        },
        template_id: 'd-ae769660ef18488487809467997242f4',
        replyTo: {
          email: 'lenoxplazaboard@gmail.com',
          name: 'Lenox Plaza Board',
        },
        subject: 'Password Reset for 1033lenox.com',
        content: [
          {
            type: 'text/html',
            value: '&nbsp;',
          },
        ],
        dynamicTemplateData: {
          user_email: 'contact@huestudios.com',
          email: 'dslfkjiiojewr980sdu09sda09',
        },
        categories: ['1033 Lenox'],
      }
 
      const sgRequest = await $fetch("https://api.sendgrid.com/v3/mail/send",
          {
              method: "POST",
              headers: {
                  Authorization: "Bearer " + config.SENDGRID_API_KEY,
                  "Content-Type": "application/json",
                  Accept: "application/json"
              },
          body: JSON.stringify(message)
      }).catch((error) => {
          console.log(error)
          return error;
      })
    return sgRequest;
})