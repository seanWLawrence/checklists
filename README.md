# Checklists and journals

This is a personal application I wrote for things I use frequently.

## Checklists

These are lists that you can use as a TODO of sorts. But they shine when you
use them for things you do regularly, like making a list of things that you
pack for travel. You can just reset the list and complete things the next time
you travel without having to create a new list.

It also has some handy things like a note field and time estimate that counts
for you. For example:

- Do this, 15m
- Do that, 15m
- Do this other thing, 2h
- Do that other thing, 1h

Total 3.5h

There are also some actions like hiding completed, clearing items, clearing
completed items, duplicating, etc. that make it useful for everyday usage.

Oh and you can do everything with your keyboard easily. Hitting enter when
focused on a checklist item input creates a new item and focuses to it. And
everything else is standard keyboard accessibility like Tab, etc.

## Journals

I journal a lot of my phone and wanted to have bullet points without typing `-
` or `* `, so each new line makes a new bullet point. There are also some
number sliders to rate how well you each day for different things, like "mood
level", "energy level", "relationships", etc. I may graph this data over time
to see how well I do over time, we'll see!

## Prerequisites

- Node.js
- Docker

## Getting started

> This section is a work in progress

- Clone the repo
- Install your dependencies with `npm install`
- Create a Vercel project and free Vercel KV store
- Pull your Vercel config using the Vercel CLI
- Add an environment variable called `AUTH_SECRET` in your
  `.env.development.local` file. This will be your password for logging in.
  You'll also add this environment variable in the Vercel console. I recommend
  using a different one for local development vs production.

### Running the local dev server

- In a terminal, start the dev server with `npm run dev`
- In another terminal, start the local Redis server with `docker compose up`
- Login with any username, and the value you set for `AUTH_SECRET` as your
  password. All checklists and journals will be stored under this username.

### Deploying

- Connect your cloned repo to Vercel for auto-deployment and it'll auto deploy
  when you push to the repo
- Infrastructure (CDK) deploy setup lives in `docs/infra-ci-setup.md`

## Technology

- Next.js/React
- Vercel
- Tailwind
- Redis
- Purify.ts
- Docker (for local Redis server)

## Tenets

- Typesafe: Makes it much easier to code in
- Private: I didn't want to share my inner most journal entries and thoughts on
  a public app that any engineer could read if they wanted to
- Access to my data: In the same vein as privacy, I want to be able to download
  all of my data anytime I want
- Functional style: It makes things easy with Monads to handle runtime
  validation and chaining async operations with nice error handling.
- Simple architecture: Vercel and Redis. No infrastructure as code needed for
  an app this simple.
- Minimalistic UI: Nothing fancy, just easy to use and works great on mobile.

## License

MIT
