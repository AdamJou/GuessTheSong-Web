<template>
  <div class="game-presentation">
    <div
      class="slides-container"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <transition name="slide-fade" mode="out-in">
        <div
          class="slide"
          :key="currentSlideIndex"
          :class="{ 'shrink-rules': currentSlideIndex === 1 }"
        >
          <h2 class="slide-title">{{ slides[currentSlideIndex].title }}</h2>
          <p class="slide-description">
            {{ slides[currentSlideIndex].description }}
          </p>
          <ul class="slide-list">
            <li
              v-for="(item, i) in slides[currentSlideIndex].items"
              :key="i"
              class="slide-item"
            >
              <font-awesome-icon
                v-if="item.icon"
                :icon="getIcon(item.icon)"
                class="item-icon"
              />
              <span class="item-text">{{ item.text }}</span>
            </li>
          </ul>
        </div>
      </transition>
    </div>
    <div class="bottom-fixed">
      <div class="nav-buttons">
        <button
          class="prev-btn"
          @click="prevSlide"
          :disabled="currentSlideIndex === 0"
        >
          ‹
        </button>
        <button
          class="next-btn"
          @click="nextSlide"
          :disabled="currentSlideIndex === slides.length - 1"
        >
          ›
        </button>
      </div>
      <div class="indicators">
        <span
          v-for="(slide, index) in slides"
          :key="index"
          :class="{ active: index === currentSlideIndex }"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

interface SlideItem {
  icon?: string;
  text: string;
}
interface Slide {
  title: string;
  description: string;
  items: SlideItem[];
}

const slides = ref<Slide[]>([
  {
    title: "Witaj w muzycznej rozgrywce! 🎵",
    description:
      "Czy kiedykolwiek zastanawiałeś się, jak dobrze znasz muzyczny gust swoich znajomych? W tej grze będziesz miał okazję to sprawdzić! Każdy wybiera swoją piosenkę, ale tylko DJ wie, co jest grane. Czy uda ci się zgadnąć, kto wybrał dany utwór? A może uda ci się zmylić wszystkich i sprawić, że nikt nie odkryje twojego wyboru? To czas na blef, strategię i dobrą zabawę!",
    items: [
      { icon: "fas fa-music", text: "Każdy gracz wybiera swoją piosenkę." },
      {
        icon: "fas fa-random",
        text: "DJ odtwarza utwory w losowej kolejności.",
      },
      {
        icon: "fas fa-gamepad",
        text: "Głosuj, analizuj i blefuj, by zdobywać punkty.",
      },
    ],
  },
  {
    title: "Zasady gry 🎮",
    description:
      "Przygotuj się na emocjonującą rywalizację! Oto jak wygląda rozgrywka:",
    items: [
      {
        icon: "fas fa-users",
        text: "Jeden gracz zakłada poczekalnię i zostaje DJ-em, reszta dołącza.",
      },
      {
        icon: "fas fa-music",
        text: "Każdy wybiera swoją piosenkę, DJ ma wgląd w wybory.",
      },
      {
        icon: "fas fa-play-circle",
        text: "DJ odtwarza utwory w wybranej kolejności.",
      },
      {
        icon: "fas fa-vote-yea",
        text: "Gracze próbują odgadnąć, kto wybrał dany utwór.",
      },
      {
        icon: "fas fa-ban",
        text: "Nie można głosować na siebie, a decyzji nie można cofnąć!",
      },
      {
        icon: "fas fa-star",
        text: "Zdobywasz punkt za poprawny wybór, bonus za brak głosów na Twój utwór!",
      },
      {
        icon: "fas fa-random",
        text: "Po każdej rundzie DJ zmienia się – zostaje nim osoba z największą liczbą punktów.",
      },
      {
        icon: "fas fa-flag-checkered",
        text: "Gra trwa, aż każdy z graczy był DJ-em przynajmniej raz!",
      },
    ],
  },
  {
    title: "Gotowy na wyzwanie? 🚀",
    description:
      "Teraz czas na Ciebie! Stwórz lobby, zaproś znajomych i sprawdź, kto ma najlepszą intuicję muzyczną. Czy zdołasz przechytrzyć resztę i ukryć swój wybór? A może Twoja znajomość gustów znajomych pozwoli Ci zdobyć najwięcej punktów? Czas się przekonać!",
    items: [
      { icon: "fas fa-sign-in-alt", text: "Załóż lub dołącz do gry." },
      {
        icon: "fas fa-music",
        text: "Wybierz swoją piosenkę i słuchaj uważnie!",
      },
      {
        icon: "fas fa-gamepad",
        text: "Głosuj, analizuj i blefuj, by zdobywać punkty.",
      },
      {
        icon: "fas fa-trophy",
        text: "Zostań najlepszym znawcą muzycznych wyborów znajomych!",
      },
    ],
  },
]);

const currentSlideIndex = ref(0);

const nextSlide = () => {
  if (currentSlideIndex.value < slides.value.length - 1)
    currentSlideIndex.value++;
};

const prevSlide = () => {
  if (currentSlideIndex.value > 0) currentSlideIndex.value--;
};

const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX;
  const delta = touchEndX.value - touchStartX.value;
  if (Math.abs(delta) > 50) delta > 0 ? prevSlide() : nextSlide();
};

const getIcon = (iconString: string): string[] => {
  if (!iconString) return [];
  const parts = iconString.split(" ");
  if (parts.length === 2 && parts[1].startsWith("fa-")) {
    parts[1] = parts[1].replace("fa-", "");
  }
  return parts;
};
</script>

<style scoped>
.game-presentation {
  position: relative;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  box-sizing: border-box;
  height: 70vh;
  overflow: hidden;
  color: white;
  border-radius: 16px;
  backdrop-filter: blur(2.7px);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 16px;
  padding: 1rem 1rem 0;
}
@media (max-width: 767px) {
  .game-presentation {
    height: 85vh;
    min-height: 450px;
  }
}
.slides-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.slide {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 4rem;
  box-sizing: border-box;
  overflow-y: hidden;
  padding: 1rem;
  text-align: left;
}
.slide-title {
  font-size: 1.25rem;
  text-align: center;
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.slide-description {
  font-size: 1rem;
  color: #b9b9b9;
  text-align: center;
  line-height: 1.4;
  margin: 0 0 0.75rem;
}
.slide-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.slide-item {
  display: flex;
  align-items: center;
  font-size: 1rem;
  margin: 0.25rem 0;
}
.item-icon {
  font-size: 1.1rem;
  margin-right: 0.4rem;
  color: #007bff;
}
.shrink-rules .slide-title,
.shrink-rules .slide-description {
  font-size: 0.95rem;
}
.shrink-rules .slide-item {
  font-size: 0.9rem;
}
.bottom-fixed {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 10;
  padding: 0.3rem 0.5rem 0.2rem;
  display: flex;
  padding-top: 0.8rem;
  flex-direction: column;
  background: rgb(55 69 178 / 10%);
  align-items: center;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}
.nav-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}
.nav-buttons button {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 1.8rem;
  height: 1.8rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.nav-buttons button:hover:not(:disabled) {
  background: #0056b3;
  transform: scale(1.05);
}
.nav-buttons button:active {
  transform: scale(0.95);
}
.indicators {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
  align-items: center;
}
.indicators span {
  width: 6px;
  height: 6px;
  background: #ccc;
  border-radius: 50%;
  transition: background 0.3s ease, transform 0.2s ease;
  cursor: pointer;
}
.indicators span.active {
  background: #007bff;
  transform: scale(1.3);
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
@media (max-width: 767px) {
  .slide {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    font-size: 0.9rem;
  }
  .slide-title {
    font-size: 1.1rem;
  }
  .slide-description,
  .slide-item {
    font-size: 0.85rem;
  }
  .nav-buttons button {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.85rem;
  }
  .item-icon {
    font-size: 0.9rem;
  }
}
.slide-item:nth-of-type(4n + 1) .item-icon {
  color: #007bff;
}
.slide-item:nth-of-type(4n + 2) .item-icon {
  color: #28a745;
}
.slide-item:nth-of-type(4n + 3) .item-icon {
  color: #dc3545;
}
.slide-item:nth-of-type(4n + 4) .item-icon {
  color: #ffc107;
}
</style>
