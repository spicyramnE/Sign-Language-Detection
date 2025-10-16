import { YouTubeEmbedProps } from "../types/common";

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ embedId }) => {
  const iframeStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    aspectRatio: "16 / 9",
    border: "none",
    display: "block",
  };

  return (
    <div>
      <iframe
        style={iframeStyle}
        src={`https://www.youtube.com/embed/${embedId}?controls=0&autoplay=1&mute=1&loop=1&playlist=${embedId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="Embedded youtube"
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;

