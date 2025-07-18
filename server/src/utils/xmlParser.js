import axios from "axios";
import { parseStringPromise } from "xml2js";

export const parseJobXml = async (url) => {
  try {
    const { data: xml } = await axios.get(url);

    const result = await parseStringPromise(xml, {
      explicitArray: false,
    });

    const items = result?.rss?.channel?.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  } catch (error) {
    console.error(` Error fetching or parsing XML from ${url}:`, error.message);
    return [];
  }
};
