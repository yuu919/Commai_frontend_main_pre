// Intentionally reject images in LLM outputs
export default function LLMImage() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn("LLMImage: Images are not supported in LLM outputs and have been disabled.");
  }
  return null;
}


