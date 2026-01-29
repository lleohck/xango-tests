import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const devBypassEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_DEV_BYPASS_ENABLED === "true";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(devBypassEnabled
      ? [
          Credentials({
            id: "dev-bypass",
            name: "DevBypass",
            credentials: {
              password: { label: "password", type: "password" },
              email: { label: "email", type: "email" },
              role: { label: "role", type: "text" },
            },
            async authorize(credentials) {
              // hard guard
              if (!devBypassEnabled) return null;

              const password = credentials?.password?.toString();
              console.log("Dev Bypass Login Attempt with password:", password);
              if (!password || password !== process.env.AUTH_DEV_BYPASS_PASSWORD) {
                return null;
              }

              const email =
                credentials?.email?.toString() ||
                process.env.AUTH_DEV_DEFAULT_EMAIL ||
                "dev@local";

              const role =
                credentials?.role?.toString() ||
                process.env.AUTH_DEV_DEFAULT_ROLE ||
                "dev";

              // usuário "real" para a sessão
              return {
                id: "dev-user",
                email,
                name: email.split("@")[0],
                role,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    jwt: async ({ token, user }) => {
      // quando authorize retorna user, ele entra aqui
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // expõe no client/server (getServerSession/auth())
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
