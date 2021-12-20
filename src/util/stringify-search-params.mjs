function stringifySearchParams(hash) {
  const params = new URLSearchParams();
  for (const key in hash) {
    let value = hash[key];
    if (typeof value !== "string") value = JSON.stringify(value);
    params.append(key, value);
  }
  params.sort();
  return params;
}

export default stringifySearchParams;
