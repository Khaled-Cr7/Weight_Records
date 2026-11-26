// Builds full image URLs so the mobile app never needs to know where images live.
const MAIN_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const CUSTOM_BASE =
  "https://raw.githubusercontent.com/Khaled-Cr7/exercise-gifs/main/";

// Exercises you added yourself (images live in your own repo)
const CUSTOM_IDS = new Set([
  "Lower_Back_Extension",
  "One_Arm_Cable_Lateral_Raise",
  "One_Arm_Cable_Curl",
]);

// Phones and GitHub keep a copy of every image address they have seen. When you
// replace a picture in your repo, add 1 to this number so the address changes
// and the app downloads the new picture instead of showing the old copy.
const CUSTOM_IMAGES_VERSION = 2;

export function imageUrls(id: string, images: string[]): string[] {
  const isCustom = CUSTOM_IDS.has(id);
  const base = isCustom ? CUSTOM_BASE : MAIN_BASE;
  return images.map((path) => {
    if (path.startsWith("http")) return path;
    return isCustom ? `${base}${path}?v=${CUSTOM_IMAGES_VERSION}` : base + path;
  });
}