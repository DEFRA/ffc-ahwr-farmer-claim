export const mqConfig = {
  host: process.env.MESSAGE_QUEUE_HOST,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  username: process.env.MESSAGE_QUEUE_USER
}

export const subscriptionConfig = {
  ...mqConfig,
  type: 'subscription'
}
