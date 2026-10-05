// Ждём загрузки страницы
document.addEventListener("DOMContentLoaded", function () {
  // Проверяем, на какой странице мы находимся
  const currentPage = window.location.pathname.split("/").pop();

  // Калькулятор КБЖУ
  if (currentPage === "index.html" || currentPage === "") {
    initCalculator();
  }

  // Дневник
  if (currentPage === "diary.html") {
    initDiary();
  }

  // Продукты
  if (currentPage === "products.html") {
    initProducts();
  }

  // Статистика
  if (currentPage === "statistics.html") {
    initStatistics();
  }
});

// ========== КАЛЬКУЛЯТОР ==========
function initCalculator() {
  const form = document.getElementById("calculator-form");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Получаем значения из формы
    const gender = document.getElementById("gender").value;
    const age = parseInt(document.getElementById("age").value);
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseInt(document.getElementById("height").value);
    const activity = parseFloat(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    // Формула Миффлина-Сан Жеора для расчёта базового метаболизма (BMR)
    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Умножаем на коэффициент активности
    let calories = bmr * activity;

    // Корректируем под цель
    if (goal === "lose") {
      calories *= 0.8; // -20% для похудения
    } else if (goal === "gain") {
      calories *= 1.15; // +15% для набора массы
    }

    // Рассчитываем БЖУ
    // Белки: 30% калорий (1г = 4 ккал)
    const proteins = Math.round((calories * 0.3) / 4);
    // Жиры: 25% калорий (1г = 9 ккал)
    const fats = Math.round((calories * 0.25) / 9);
    // Углеводы: 45% калорий (1г = 4 ккал)
    const carbs = Math.round((calories * 0.45) / 4);

    // Показываем результаты
    document.getElementById("calories").textContent = Math.round(calories);
    document.getElementById("proteins").textContent = proteins;
    document.getElementById("fats").textContent = fats;
    document.getElementById("carbs").textContent = carbs;
    // Показываем блок с результатами
    document.getElementById("result").style.display = "block";

    // ✅ ПОКАЗЫВАЕМ ДИАГРАММУ И ОБНОВЛЯЕМ ЛЕГЕНДУ
    const macrosChart = document.getElementById("macros-chart");
    if (macrosChart) {
      macrosChart.style.display = "block";
      // ... (предыдущий код с диаграммой) ...

      // ✅ ПОКАЗЫВАЕМ СОВЕТЫ ПО ПИТАНИЮ
      const tipsContainer = document.getElementById("tips-container");
      const tipsList = document.getElementById("tips-list");

      if (tipsContainer && tipsList) {
        const tips = getNutritionTips(goal); // Получаем массив советов
        // Превращаем массив в HTML-список и вставляем в блок
        tipsList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
        // Показываем блок
        tipsContainer.style.display = "block";
      }

      // Обновляем значения в легенде (числа, а не элементы!)
      document.getElementById("legend-proteins").textContent = proteins;
      document.getElementById("legend-fats").textContent = fats;
      document.getElementById("legend-carbs").textContent = carbs;

      // Обновляем проценты для круговой диаграммы
      const total = proteins + fats + carbs;
      const proteinsPercent = Math.round((proteins / total) * 100);
      const fatsPercent = Math.round((fats / total) * 100);
      const carbsPercent = Math.round((carbs / total) * 100);

      // Находим сегменты диаграммы и обновляем их
      const segments = macrosChart.querySelectorAll(".pie-segment");
      if (segments.length > 0) {
        segments[0].style.setProperty("--percent", proteinsPercent);
        segments[1].style.setProperty("--percent", fatsPercent);
        segments[2].style.setProperty("--percent", carbsPercent);
      }

      // Обновляем конический градиент для правильной визуализации
      const pieChart = macrosChart.querySelector(".pie-chart");
      if (pieChart) {
        pieChart.style.background = `conic-gradient(
      #667eea 0deg ${proteinsPercent * 3.6}deg,
      #f093fb ${proteinsPercent * 3.6}deg ${(proteinsPercent + fatsPercent) * 3.6}deg,
      #4facfe ${(proteinsPercent + fatsPercent) * 3.6}deg 360deg
    )`;
      }
    }

    // Показываем блок с результатами
    document.getElementById("result").style.display = "block";

    // Сохраняем цель в localStorage
    localStorage.setItem(
      "dailyGoal",
      JSON.stringify({
        calories: Math.round(calories),
        proteins: proteins,
        fats: fats,
        carbs: carbs,
      }),
    );
  });
}
// ========== ДНЕВНИК ==========
function initDiary() {
  const form = document.getElementById("diary-form");
  const entriesList = document.getElementById("entries-list");
  const totalBox = document.getElementById("total-box");

  if (!form) return;

  // Загружаем записи из localStorage
  let entries = JSON.parse(localStorage.getItem("diaryEntries")) || [];

  // Отображаем сохранённые записи
  renderEntries(entries);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Получаем значения ИЗ ФОРМЫ (внутри обработчика!)
    const productName = document.getElementById("product-name").value;
    const weight = parseFloat(document.getElementById("product-weight").value);
    const calories = parseFloat(
      document.getElementById("product-calories").value,
    );
    const proteins = parseFloat(
      document.getElementById("product-proteins").value,
    );
    const fats = parseFloat(document.getElementById("product-fats").value);
    const carbs = parseFloat(document.getElementById("product-carbs").value);

    // Рассчитываем КБЖУ с учётом веса порции (на 100г)
    const portion = weight / 100;

    const entry = {
      id: Date.now(),
      name: productName,
      weight: weight,
      calories: Math.round(calories * portion),
      proteins: Math.round(proteins * portion * 10) / 10,
      fats: Math.round(fats * portion * 10) / 10,
      carbs: Math.round(carbs * portion * 10) / 10,
      date: new Date().toLocaleDateString("ru-RU"),
    };

    entries.push(entry);
    localStorage.setItem("diaryEntries", JSON.stringify(entries));

    renderEntries(entries);
    form.reset();

    // ✅ ПРАВИЛЬНОЕ МЕСТО ДЛЯ УВЕДОМЛЕНИЯ (внутри submit, после reset)
    showToast(`${productName} (${weight}г) добавлен в дневник!`);
  });

  function renderEntries(entries) {
    entriesList.innerHTML = "";

    let totalCalories = 0;
    let totalProteins = 0;
    let totalFats = 0;
    let totalCarbs = 0;

    entries.forEach((entry) => {
      totalCalories += entry.calories;
      totalProteins += entry.proteins;
      totalFats += entry.fats;
      totalCarbs += entry.carbs;

      const entryDiv = document.createElement("div");
      entryDiv.className = "diary-entry";
      entryDiv.innerHTML = `
                <div>
                    <strong>${entry.name}</strong> - ${entry.weight}г
                    <br>
                    <small>К: ${entry.calories} | Б: ${entry.proteins}г | Ж: ${entry.fats}г | У: ${entry.carbs}г</small>
                </div>
                <button onclick="deleteEntry(${entry.id})">Удалить</button>
            `;
      entriesList.appendChild(entryDiv);
    });

    // Показываем итоги
    if (totalBox && entries.length > 0) {
      totalBox.style.display = "block"; // Важно показать блок!
      totalBox.innerHTML = `
                <h3>Итого за день:</h3>
                <div class="result-item">
                    <span>🔥 Калории:</span>
                    <strong>${totalCalories}</strong> ккал
                </div>
                <div class="result-item">
                    <span>🥩 Белки:</span>
                    <strong>${totalProteins.toFixed(1)}</strong> г
                </div>
                <div class="result-item">
                    <span>🥑 Жиры:</span>
                    <strong>${totalFats.toFixed(1)}</strong> г
                </div>
                <div class="result-item">
                    <span> Углеводы:</span>
                    <strong>${totalCarbs.toFixed(1)}</strong> г
                </div>
            `;
    } else {
      totalBox.style.display = "none"; // Скрываем, если пусто
    }
  }
}

function deleteEntry(id) {
  let entries = JSON.parse(localStorage.getItem("diaryEntries")) || [];
  entries = entries.filter((entry) => entry.id !== id);
  localStorage.setItem("diaryEntries", JSON.stringify(entries));
  location.reload();
}

// ========== ПРОДУКТЫ ==========
function initProducts() {
  // База продуктов (вместо БД - просто массив)
  const products = [
    {
      name: "Куриная грудка",
      calories: 165,
      proteins: 31,
      fats: 3.6,
      carbs: 0,
    },
    { name: "Рис белый", calories: 130, proteins: 2.7, fats: 0.3, carbs: 28 },
    { name: "Гречка", calories: 132, proteins: 4.5, fats: 1.6, carbs: 25 },
    { name: "Овсянка", calories: 88, proteins: 3, fats: 1.7, carbs: 15 },
    { name: "Яйцо куриное", calories: 155, proteins: 13, fats: 11, carbs: 1.1 },
    { name: "Творог 5%", calories: 121, proteins: 17, fats: 5, carbs: 1.8 },
    { name: "Молоко 2.5%", calories: 52, proteins: 2.8, fats: 2.5, carbs: 4.7 },
    { name: "Хлеб белый", calories: 265, proteins: 7, fats: 3.2, carbs: 49 },
    { name: "Яблоко", calories: 52, proteins: 0.3, fats: 0.2, carbs: 14 },
    { name: "Банан", calories: 89, proteins: 1.1, fats: 0.3, carbs: 23 },
    { name: "Морковь", calories: 41, proteins: 0.9, fats: 0.2, carbs: 9.6 },
    { name: "Помидор", calories: 18, proteins: 0.9, fats: 0.2, carbs: 3.9 },
    { name: "Огурец", calories: 15, proteins: 0.7, fats: 0.1, carbs: 3.6 },
    { name: "Картофель", calories: 77, proteins: 2, fats: 0.1, carbs: 17 },
    { name: "Говядина", calories: 250, proteins: 26, fats: 15, carbs: 0 },
    { name: "Свинина", calories: 271, proteins: 27, fats: 18, carbs: 0 },
    { name: "Лосось", calories: 208, proteins: 20, fats: 13, carbs: 0 },
    { name: "Тунец", calories: 132, proteins: 28, fats: 1.3, carbs: 0 },
    { name: "Сыр твёрдый", calories: 402, proteins: 25, fats: 33, carbs: 1.3 },
    {
      name: "Масло сливочное",
      calories: 717,
      proteins: 0.9,
      fats: 81,
      carbs: 0.1,
    },
  ];

  const tableBody = document.getElementById("products-table-body");

  if (!tableBody) return;

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.calories}</td>
            <td>${product.proteins}</td>
            <td>${product.fats}</td>
            <td>${product.carbs}</td>
        `;
    tableBody.appendChild(row);
  });
  // Логика живого поиска
  const searchInput = document.getElementById("product-search");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll("#products-table-body tr");

      let visibleCount = 0;

      rows.forEach((row) => {
        const name = row.cells[0].textContent.toLowerCase();
        if (name.includes(query)) {
          row.style.display = "";
          visibleCount++;
        } else {
          row.style.display = "none";
        }
      });

      // Если ничего не найдено, можно показать сообщение (опционально)
      const tableBody = document.getElementById("products-table-body");
      let noResultsMsg = document.getElementById("no-results-msg");

      if (visibleCount === 0 && query !== "") {
        if (!noResultsMsg) {
          noResultsMsg = document.createElement("tr");
          noResultsMsg.id = "no-results-msg";
          noResultsMsg.innerHTML =
            '<td colspan="5" style="text-align:center; color:#888; padding:2rem;">Ничего не найдено 😕</td>';
          tableBody.appendChild(noResultsMsg);
        }
      } else if (noResultsMsg) {
        noResultsMsg.remove();
      }
    });
  }
}

// ========== СТАТИСТИКА ==========
function initStatistics() {
  const chartContainer = document.getElementById("chart-container");
  const goalBox = document.getElementById("goal-box");

  if (!chartContainer) return;

  // Получаем записи из localStorage
  const entries = JSON.parse(localStorage.getItem("diaryEntries")) || [];

  // ===== ОТОБРАЖАЕМ ЦЕЛЬ (это я забыл добавить!) =====
  if (goalBox) {
    const goal = JSON.parse(localStorage.getItem("dailyGoal"));

    if (goal) {
      goalBox.innerHTML = `
                <div class="result-item">
                    <span>🔥 Калории:</span>
                    <strong>${goal.calories}</strong> ккал
                </div>
                <div class="result-item">
                    <span>🥩 Белки:</span>
                    <strong>${goal.proteins}</strong> г
                </div>
                <div class="result-item">
                    <span>🥑 Жиры:</span>
                    <strong>${goal.fats}</strong> г
                </div>
                <div class="result-item">
                    <span>🍞 Углеводы:</span>
                    <strong>${goal.carbs}</strong> г
                </div>
            `;
    } else {
      goalBox.innerHTML = `
                <p style="color: #888; text-align: center;">
                    ️ Цель не установлена. Перейдите на страницу 
                    <a href="index.html">"Калькулятор"</a> и рассчитайте норму КБЖУ.
                </p>
            `;
    }
  }

  // ===== ГРАФИК =====
  if (entries.length === 0) {
    chartContainer.innerHTML =
      '<p style="text-align: center; color: #888;">Пока нет данных для отображения. Добавьте продукты в дневник.</p>';
    return;
  }

  // Группируем по датам
  const dailyStats = {};
  entries.forEach((entry) => {
    if (!dailyStats[entry.date]) {
      dailyStats[entry.date] = { calories: 0, proteins: 0, fats: 0, carbs: 0 };
    }
    dailyStats[entry.date].calories += entry.calories;
    dailyStats[entry.date].proteins += entry.proteins;
    dailyStats[entry.date].fats += entry.fats;
    dailyStats[entry.date].carbs += entry.carbs;
  });

  // Создаём график
  const dates = Object.keys(dailyStats);
  const maxCalories = Math.max(
    ...dates.map((date) => dailyStats[date].calories),
  );

  let chartHTML = '<div class="bar-chart">';
  dates.forEach((date) => {
    const height = Math.max(
      (dailyStats[date].calories / maxCalories) * 200,
      30,
    );
    chartHTML += `
            <div class="bar" style="height: ${height}px;">
                <div class="bar-value">${dailyStats[date].calories}</div>
                <div class="bar-label">${date}</div>
            </div>
        `;
  });
  chartHTML += "</div>";

  chartContainer.innerHTML = chartHTML;
  // ===== РАСЧЁТ И ОТРИСОВКА ПРОГРЕСС-БАРА =====
  const progressSection = document.getElementById("progress-section");
  if (progressSection) {
    const goal = JSON.parse(localStorage.getItem("dailyGoal"));

    // Получаем записи только за СЕГОДНЯ
    const todayStr = new Date().toLocaleDateString("ru-RU");
    const todayEntries = entries.filter((e) => e.date === todayStr);
    const todayCalories = todayEntries.reduce((sum, e) => sum + e.calories, 0);

    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const progressStatus = document.getElementById("progress-status");

    if (goal && goal.calories > 0) {
      // Считаем процент (не больше 100 для ширины, но текст покажем реальный)
      let percent = Math.round((todayCalories / goal.calories) * 100);
      let displayPercent = percent > 100 ? 100 : percent;

      // Анимируем ширину
      progressBar.style.width = displayPercent + "%";
      progressText.textContent = percent + "%";

      // Меняем цвет и текст в зависимости от ситуации
      if (percent < 50) {
        progressBar.style.background =
          "linear-gradient(90deg, #f093fb 0%, #f5576c 100%)";
        progressStatus.textContent = `Осталось съесть ещё ${goal.calories - todayCalories} ккал`;
      } else if (percent <= 100) {
        progressBar.style.background =
          "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)";
        progressStatus.textContent = "Отлично! Вы в рамках нормы ✅";
      } else {
        progressBar.style.background =
          "linear-gradient(90deg, #fa709a 0%, #fee140 100%)";
        progressText.style.color = "#fff";
        progressStatus.textContent = `⚠️ Перебор на ${todayCalories - goal.calories} ккал!`;
      }
    } else {
      progressSection.style.display = "none"; // Скрываем, если цель не задана
    }
  }
}

// Функция очистки всего дневника
function clearDiary() {
  if (confirm("Вы уверены, что хотите удалить все записи дневника?")) {
    localStorage.removeItem("diaryEntries");
    location.reload();
  }
}

function showToast(message, isSuccess = true) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.borderLeftColor = isSuccess ? "#4caf50" : "#f44336";
  toast.innerHTML = `<span>${isSuccess ? "✅" : "⚠️"}</span> ${message}`;

  container.appendChild(toast);

  // Удаляем уведомление через 3 секунды
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Функция для получения советов в зависимости от цели
function getNutritionTips(goal) {
  if (goal === "lose") {
    return [
      "Пейте 2-3 литра чистой воды в день для ускорения метаболизма.",
      "Увеличьте долю овощей и зелени в каждом приёме пищи.",
      "Старайтесь есть каждые 3-4 часа, чтобы избежать сильного голода.",
      "Добавьте 30 минут лёгкой активности (например, ходьбу) к своему дню.",
    ];
  } else if (goal === "gain") {
    return [
      "Увеличьте потребление белка до 1.6-2 г на 1 кг веса тела.",
      "Добавляйте калорийные, но полезные перекусы (орехи, авокадо, сыр).",
      "Сочетайте профицит калорий с силовыми тренировками для роста мышц.",
      "Спите не менее 7-8 часов для качественного восстановления организма.",
    ];
  } else {
    return [
      "Поддерживайте баланс БЖУ: 30% белки, 25% жиры, 45% углеводы.",
      "Включайте в рацион источники полезных жиров (рыба, оливковое масло).",
      "Отдавайте предпочтение цельным, необработанным продуктам.",
      "Регулярно отслеживайте вес и корректируйте рацион при необходимости.",
    ];
  }
}
