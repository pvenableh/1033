import { Buffer } from 'buffer'

export default defineEventHandler(async (event) => {
    console.log(event)
    const query = getQuery(event)
    console.log(query)
    const encoded_email = Buffer.from(query.email).toString('base64')
    console.log(encoded_email)
    const config = useRuntimeConfig();
    const message = {
        personalizations: [
          {
            to: [
              {
                email: query.email,
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
            user_email: query.email,
            email: encoded_email,
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