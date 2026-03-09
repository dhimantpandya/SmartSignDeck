import config from "../../config/config";
import ApiError from "../../utils/ApiError";

const errorResponse = (
  message: string,
  statusCode: number,
  data: Record<string, unknown>,
): void => {
  throw new ApiError(statusCode, message, true);
};

export default errorResponse;
