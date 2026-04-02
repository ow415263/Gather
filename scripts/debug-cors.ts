import handler from "../api/extract-recipe.ts"

async function run() {
  const req: any = {
    method: 'OPTIONS',
    headers: {
      origin: 'https://recipe-vault-ekvgp90yp-owen-campbells-projects.vercel.app',
      'access-control-request-headers': 'content-type,x-user-id'
    },
    query: {}
  }

  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    json(payload: unknown) {
      console.log('json response', this.statusCode, this.headers, payload)
      return this
    },
    end() {
      console.log('end response', this.statusCode, this.headers)
      return this
    }
  }

  await handler(req, res)
}

run().catch(err => {
  console.error('handler threw', err)
})
