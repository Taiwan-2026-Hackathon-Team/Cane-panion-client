export const authKeys = {
  all: ['auth'] as const,
  token: () => [...authKeys.all, 'token'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};
