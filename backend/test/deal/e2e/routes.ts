const BASE_URL = "/deal";

const POST = {
  CREATE: BASE_URL,
};

const GET = { SEARCH: `${BASE_URL}/search` };
const PATCH = { UPDATE: (id: string) => `${BASE_URL}/${id}` };
export const DealRoutes = { GET, PATCH, POST };
