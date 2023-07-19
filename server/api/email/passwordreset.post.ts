import sgMail from '@sendgrid/mail'
import { Buffer } from 'buffer'


export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    sgMail.setApiKey(config.SENDGRID_API_KEY)
  const query = getQuery(event)
  const encoded_email = Buffer.from(query.email).toString('base64')
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

  // sendgrid.send(message)
  //     .then(() => console.log('Mail sent successfully'))
  //     .catch(error => {
  //         console.error(error);
  //     });

  sgMail.send(message).then(
    (res) => {
        console.log(res)
        console.log('Mail sent successfully')
    },
    (error) => {
      console.error(error)
      if (error.response) {
        console.error(error.response.body)
        const error = error.response.body
      }
    }
  )
  console.log(sgMail)
})
