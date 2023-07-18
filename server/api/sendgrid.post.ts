import sgMail from '@sendgrid/mail'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  console.log(body)
  sgMail.setApiKey('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')
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
  sgMail.send(message).then(
    () => {
      console.log('Mail sent successfully')
    },
    (error) => {
      console.error(error)
      if (error.response) {
        console.error(error.response.body)
        console.log(error)
        // const error = error.response.body
      }
    }
  )
})
