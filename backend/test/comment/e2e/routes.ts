const BASE_URL = "/comment";

const GET = { LIST_BY_DEAL: (dealId: string) => `${BASE_URL}/deal/${dealId}` };
const POST = { CREATE: BASE_URL };

export const CommentRoutes = { GET, POST };
