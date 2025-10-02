// Текущая тема
let currentTheme = 'light';

// Объекты для хранения настроек
let probabilitySettings = {};
let usedNumbers = [];
let nextForcedNumber = null;
let clickCount = 0;
let clickTimer = null;

// Загрузка настроек из localStorage при запуске
function loadSettings() {
    const savedProbability = localStorage.getItem('probabilitySettings');
    const savedNextNumber = localStorage.getItem('nextForcedNumber');
    
    if (savedProbability) {
        probabilitySettings = JSON.parse(savedProbability);
        updateProbabilityList();
    }
    
    if (savedNextNumber) {
        nextForcedNumber = parseInt(savedNextNumber);
        document.getElementById('nextNumber').value = nextForcedNumber;
    }
}

// Сохранение настроек в localStorage
function saveSettings() {
    localStorage.setItem('probabilitySettings', JSON.stringify(probabilitySettings));
    if (nextForcedNumber !== null) {
        localStorage.setItem('nextForcedNumber', nextForcedNumber.toString());
    } else {
        localStorage.removeItem('nextForcedNumber');
    }
}

// Функция для открытия полноэкранного меню
function openFullscreenMenu() {
    document.getElementById("fullscreenMenu").classList.add("show");
}

// Функция для закрытия полноэкранного меню
function closeFullscreenMenu() {
    document.getElementById("fullscreenMenu").classList.remove("show");
}

// Функция для смены темы
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    currentTheme = newTheme;
    closeFullscreenMenu();
}

// Функция обработки клика по BAZUKA STUDIO
function handleStudioClick() {
    clickCount++;
    
    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 500);
    } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        clickCount = 0;
        openAdminModal();
    }
}

// Функция генерации случайного числа
function generateNumber() {
    const min = parseInt(document.getElementById('minRange').value) || 0;
    const max = parseInt(document.getElementById('maxRange').value) || 100;
    const noRepeat = document.getElementById('noRepeatToggle').checked;
    
    if (min >= max) {
        alert("Минимальное значение должно быть меньше максимального");
        return;
    }

    const totalNumbers = max - min + 1;
    
    if (noRepeat && usedNumbers.length >= totalNumbers) {
        showNumbersExhaustedNotification();
        return;
    }

    const resultElement = document.getElementById('result');
    
    resultElement.textContent = '...';
    let spins = 0;
    const spinInterval = setInterval(() => {
        resultElement.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
        spins++;
        if (spins > 10) {
            clearInterval(spinInterval);
            
            let finalNumber;
            
            // Проверка на принудительное следующее число
            if (nextForcedNumber !== null && nextForcedNumber >= min && nextForcedNumber <= max) {
                finalNumber = nextForcedNumber;
                nextForcedNumber = null; // Сбрасываем после использования
                localStorage.removeItem('nextForcedNumber'); // Удаляем из хранилища
                document.getElementById('nextNumber').value = '';
            } else {
                // Обычная генерация с учетом вероятностей
                if (noRepeat) {
                    do {
                        finalNumber = calculateFinalNumber(min, max);
                    } while (usedNumbers.includes(finalNumber));
                    usedNumbers.push(finalNumber);
                } else {
                    finalNumber = calculateFinalNumber(min, max);
                }
            }
            
            resultElement.textContent = finalNumber;
            saveSettings(); // Сохраняем изменения
        }
    }, 100);
}

// Функция для расчета финального числа с учетом вероятности
function calculateFinalNumber(min, max) {
    // Если для какого-то числа в текущем диапазоне задана вероятность, используем взвешенный случайный выбор
    let totalConfiguredProbability = 0;
    const numbersInRange = [];
    
    // Собираем все числа из текущего диапазона, для которых задана вероятность
    for (let i = min; i <= max; i++) {
        if (probabilitySettings[i] !== undefined) {
            numbersInRange.push({
                number: i,
                probability: probabilitySettings[i]
            });
            totalConfiguredProbability += probabilitySettings[i];
        }
    }
    
    // Если есть настроенные числа и суммарная вероятность меньше или равна 100%
    if (numbersInRange.length > 0 && totalConfiguredProbability <= 100) {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        
        // Проверяем настроенные числа
        for (const item of numbersInRange) {
            cumulativeProbability += item.probability;
            if (random <= cumulativeProbability) {
                return item.number;
            }
        }
    }
    
    // Если настроек нет или случайное значение не попало в заданные вероятности,
    // генерируем обычное случайное число
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Функция для установки следующего числа
function setNextNumber() {
    const number = parseInt(document.getElementById('nextNumber').value);
    
    if (!isNaN(number)) {
        nextForcedNumber = number;
        alert(`Следующее число будет: ${number}`);
        saveSettings();
    } else {
        alert('Пожалуйста, введите корректное число');
    }
}

// Функция для установки вероятности
function setProbability() {
    const number = parseInt(document.getElementById('targetNumber').value);
    const probability = parseFloat(document.getElementById('probability').value);
    
    if (!isNaN(number) && !isNaN(probability) && probability >= 0 && probability <= 100) {
        probabilitySettings[number] = probability;
        alert(`Вероятность выпадения числа ${number} установлена на ${probability}%`);
        
        // Очищаем поля
        document.getElementById('targetNumber').value = '';
        document.getElementById('probability').value = '';
        
        updateProbabilityList();
        saveSettings();
    } else {
        alert('Пожалуйста, введите корректные значения');
    }
}

// Функция для обновления списка вероятностей
function updateProbabilityList() {
    const list = document.getElementById('probabilityList');
    list.innerHTML = '';
    
    for (const [number, probability] of Object.entries(probabilitySettings)) {
        const item = document.createElement('div');
        item.className = 'probability-item';
        item.innerHTML = `
            <span>Число ${number}: ${probability}%</span>
            <button class="remove-btn" onclick="removeProbability(${number})">Удалить</button>
        `;
        list.appendChild(item);
    }
    
    if (Object.keys(probabilitySettings).length === 0) {
        list.innerHTML = '<div style="text-align: center; opacity: 0.7;">Нет настроенных вероятностей</div>';
    }
}

// Функция для удаления вероятности
function removeProbability(number) {
    delete probabilitySettings[number];
    updateProbabilityList();
    saveSettings();
}

function showNumbersExhaustedNotification() {
    document.getElementById('numbersExhaustedNotification').style.display = 'block';
}

function closeNotification() {
    document.getElementById('numbersExhaustedNotification').style.display = 'none';
    usedNumbers = [];
}

// Функции для работы с модальным окном администратора
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'block';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('login').value = '';
    document.getElementById('password').value = '';
}

function checkAdminCredentials() {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    if (login === '74' && password === '5090') {
        document.getElementById('adminPanel').style.display = 'block';
        closeAdminModal();
        loadSettings(); // Загружаем настройки при открытии панели
    } else {
        alert('Неверный логин или пароль');
    }
}

// Функция для выхода из панели администратора
function logoutAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
}

window.onclick = function(event) {
    const fullscreenMenu = document.getElementById("fullscreenMenu");
    if (event.target === fullscreenMenu) {
        closeFullscreenMenu();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('studioText').addEventListener('click', handleStudioClick);
    loadSettings(); // Загружаем сохраненные настройки
});