function formatBloodType(bloodType: string) {
  // Convert to lowercase
  const lowerCaseType = bloodType.toLowerCase();

  // Replace 'positive' with '+' and 'negative' with '-'
  const formattedType = lowerCaseType
    .replace('positive', '+')
    .replace('negative', '-');

  return formattedType;
}

export { formatBloodType };
