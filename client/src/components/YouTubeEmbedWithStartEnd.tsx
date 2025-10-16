import { YouTubeEmbedWithStartEndProps } from "../types/common";

const YouTubeEmbedWithStartEnd: React.FC<YouTubeEmbedWithStartEndProps> = ({ embedId, startTime, uniqueParam }) => {
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
        src={`https://www.youtube.com/embed/${embedId}?start=${startTime}&controls=1&autoplay=1&mute=1&loop=1&playlist=${embedId}${uniqueParam}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="Embedded youtube"
      ></iframe>
    </div>
  );
};

export default YouTubeEmbedWithStartEnd;