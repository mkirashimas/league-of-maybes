import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API. Features add their own endpoints and tag types via
// api.enhanceEndpoints({ addTagTypes: [...] }).injectEndpoints(...).
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  endpoints: () => ({}),
});
