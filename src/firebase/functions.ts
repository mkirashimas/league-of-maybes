import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';

/** Where the Cloud Functions run. The client SDK would default to us-central1 (R9). */
const FUNCTIONS_REGION = 'europe-west1';

const functions = getFunctions(app, FUNCTIONS_REGION);

/** Calls an HTTPS callable function and returns its result. Carries Auth and App Check tokens. */
export const callFunction = async <Request, Response>(
  name: string,
  data: Request,
): Promise<Response> => {
  const result = await httpsCallable<Request, Response>(functions, name)(data);
  return result.data;
};
