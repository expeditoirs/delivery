import { useNavigate } from "react-router-dom";
import StoryBar from "../../components/stories/StoryBar";
import StoryViewer from "../../components/stories/StoryViewer";
import HeroSection from "./components/HeroSection";
import RestaurantStrip from "./components/RestaurantStrip";
import useSocialHomeData from "./useSocialHomeData";

export default function HomeStore() {
  const navigate = useNavigate();
  const {
    empresas,
    stories,
    loading,
    storyAberto,
    setStoryAberto,
  } = useSocialHomeData();

  function openCategory(categoryKey) {
    const params = new URLSearchParams({ categoria: categoryKey });
    navigate(`/buscar?${params.toString()}`);
  }

  return (
    <div className="w-full min-h-full bg-theme pb-24">
      <HeroSection
        onSearch={() => navigate("/buscar")}
        onCategorySelect={openCategory}
      />
      <StoryBar stories={stories} loading={loading} onOpen={setStoryAberto} />
      <RestaurantStrip
        empresas={empresas}
        loading={loading}
        onOpen={(empresa) => navigate(`/cardapio/${empresa.id}`)}
      />

      <StoryViewer story={storyAberto} onClose={() => setStoryAberto(null)} />
    </div>
  );
}
