import axios from "axios";
import { parseStringPromise } from "xml2js";
import logger from "../config/logger.js";

export const parseJobXml = async (url) => {
  try {
    const { data: xml } = await axios.get(url, {
      timeout: Number(process.env.FEED_TIMEOUT_MS) || 15000,
      headers: {
        Accept: "application/xml,text/xml",
        "User-Agent": "JobImporterBot/1.0",
      },
    });

    const result = await parseStringPromise(xml, {
      explicitArray: false,
      trim: true,
    });

    const items = result?.rss?.channel?.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  } catch (error) {
    logger.error(
      { url, message: error.message },
      "Error fetching or parsing XML"
    );
    return [];
  }
};
