function dateTime(): any {
  let dateTime = new Date();
  dateTime.setHours(dateTime.getHours() + 5);
  return dateTime;
}

export { dateTime };
