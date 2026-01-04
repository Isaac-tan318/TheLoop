export const getInterestsFromEvents = (events) => {
  const interestSet = new Set();
  
  events.forEach(event => {
    if (event.interests && Array.isArray(event.interests)) {
      event.interests.forEach(interest => interestSet.add(interest));
    }
  });
  
  return Array.from(interestSet).sort();
};
