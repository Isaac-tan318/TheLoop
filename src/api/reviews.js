import api from './config';

export const getEventReviews = async (eventId) => {
  return await api.get(`/reviews?eventId=${eventId}`);
};

export const getUserEventReview = async (eventId, userId) => {
  const result = await api.get(`/reviews?eventId=${eventId}&userId=${userId}`);
  if (!result.success) return result;
  return { success: true, data: result.data[0] || null };
};

export const createReview = async (eventId, rating, comment) => {
  return await api.post('/reviews', { eventId, rating, comment });
};

export const updateReview = async (reviewId, rating, comment) => {
  return await api.put(`/reviews/${reviewId}`, { rating, comment });
};

export const deleteReview = async (reviewId) => {
  return await api.delete(`/reviews/${reviewId}`);
};
