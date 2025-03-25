<template>
  <div class="presentation-wrapper">
    <div
      class="slides-container"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <transition name="slide-fade" mode="out-in">
        <div
          class="slide-container"
          :key="currentSlideIndex"
          :class="{ 'shrink-rules': currentSlideIndex === 1 }"
        >
          <h2 class="slide-title">{{ slides[currentSlideIndex].title }}</h2>
          <div class="slide">
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
.presentation-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: white;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: rgba(81, 24, 204, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(2.7px);
}

.slides-container {
  flex: 1;
  min-height: 0;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
}

.slide-container {
  display: flex;
  padding: 0.5rem;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.slide-title {
  font-size: clamp(1.25rem, 2vw + 0.5rem, 1.5rem);
  text-align: center;
  font-weight: 600;
  margin: 0;
  flex-shrink: 0;
}

.slide {
  flex: 1;
  min-height: 0;
  padding: 0.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.slide::-webkit-scrollbar {
  width: 5px;
}

.slide::-webkit-scrollbar-track {
  background: transparent;
}

.slide::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.slide-description {
  font-size: clamp(0.875rem, 1vw + 0.5rem, 1rem);
  color: #b9b9b9;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.slide-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.slide-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: clamp(0.875rem, 1vw + 0.5rem, 1rem);
  line-height: 1.4;
}

.item-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  margin-top: 0.2rem;
}

.item-text {
  flex: 1;
}

.bottom-fixed {
  margin-top: auto;
  padding: 0.75rem;
  background: rgba(55, 69, 178, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 0 0 16px 16px;
}

.nav-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.nav-buttons button {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  font-size: 1.2rem;
  color: #fff;
  background: #007bff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s ease;
}

.nav-buttons button:disabled {
  background: rgba(204, 204, 204, 0.3);
  cursor: not-allowed;
}

.nav-buttons button:not(:disabled):hover {
  background: #0056b3;
  transform: scale(1.05);
}

.indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.indicators span {
  width: 8px;
  height: 8px;
  background: rgba(204, 204, 204, 0.3);
  border-radius: 50%;
  transition: 0.2s ease;
  cursor: pointer;
}

.indicators span.active {
  background: #007bff;
  transform: scale(1.3);
}

/* Icon colors */
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

@media (max-width: 767px) {
  .slide-title {
    padding: 0.75rem 0.75rem 0.5rem;
  }

  .slide {
    padding: 0 0.75rem 0.75rem;
  }

  .nav-buttons button {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 1rem;
  }

  .indicators span {
    width: 6px;
    height: 6px;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
