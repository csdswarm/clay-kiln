function formatError (err) {
  if (err.response) {
    const { errors } = err.response.data
    return new Error(errors[0].detail)
  }

  return new Error('Something bad happened!')
}

export default formatError
