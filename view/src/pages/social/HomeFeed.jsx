import StoryBar from "../../components/stories/StoryBar";
import StoryViewer from "../../components/stories/StoryViewer";
import FeedSection from "./components/FeedSection";
import useSocialHomeData from "./useSocialHomeData";

export default function HomeFeed() {
  const {
    stories,
    feed,
    loading,
    erro,
    storyAberto,
    setStoryAberto,
  } = useSocialHomeData();

  return (
    <div className="w-full min-h-full bg-theme pb-24">
      <StoryBar stories={stories} loading={loading} onOpen={setStoryAberto} />
      <FeedSection erro={erro} loading={loading} feed={feed} />
      <StoryViewer story={storyAberto} onClose={() => setStoryAberto(null)} />
    </div>
  );
}
