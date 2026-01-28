import { createAuth0Client, type Auth0Client, type User } from "@auth0/auth0-spa-js";

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;
const connection = import.meta.env.VITE_AUTH0_LINKEDIN_CONNECTION as string | undefined;

let clientPromise: Promise<Auth0Client> | null = null;

export const isAuth0Configured = () => Boolean(domain && clientId);

const getClient = async () => {
  if (!isAuth0Configured()) {
    throw new Error("Auth0 is not configured.");
  }
  if (!clientPromise) {
    clientPromise = createAuth0Client({
      domain: domain as string,
      clientId: clientId as string,
      cacheLocation: "localstorage",
      authorizationParams: {
        audience,
        scope: "openid profile email",
      },
    });
  }
  return clientPromise;
};

export const loginWithLinkedInPopup = async (): Promise<User | null> => {
  const client = await getClient();
  await client.loginWithPopup({
    authorizationParams: {
      connection: connection || "linkedin",
      audience,
      scope: "openid profile email",
    },
  });
  return (await client.getUser()) ?? null;
};
