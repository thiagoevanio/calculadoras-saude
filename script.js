// Estado global
let selectedGender = '';
let selectedActivity = '';

// Funções de navegação
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    
    menu.classList.toggle('active');
    
    if (menu.classList.contains('active')) {
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
    } else {
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    
    menu.classList.remove('active');
    menuIcon.style.display = 'block';
    closeIcon.style.display = 'none';
}

// Funções de cálculo BMI
function calculateBMI() {
    const weight = parseFloat(document.getElementById('bmi-weight').value);
    const height = parseFloat(document.getElementById('bmi-height').value);
    
    // Limpar erros anteriores
    clearErrors('bmi');
    
    // Validação
    const errors = validateBMIData(weight, height);
    
    if (Object.keys(errors).length > 0) {
        showErrors('bmi', errors);
        document.getElementById('bmi-result').classList.add('hidden');
        return;
    }
    
    // Cálculo
    const result = calculateBMIValue(weight, height);
    
    // Mostrar resultado
    showBMIResult(result);
    
    // Scroll para resultado
    setTimeout(() => {
        document.getElementById('bmi-result').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

function calculateBMIValue(weight, height) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    let description = '';
    let colorClass = '';
    
    if (bmi < 18.5) {
        category = 'Abaixo do peso';
        description = 'Você está abaixo do peso ideal. Considere consultar um nutricionista.';
        colorClass = 'bmi-underweight';
    } else if (bmi >= 18.5 && bmi < 25) {
        category = 'Peso normal';
        description = 'Parabéns! Você está com o peso ideal para sua altura.';
        colorClass = 'bmi-normal';
    } else if (bmi >= 25 && bmi < 30) {
        category = 'Sobrepeso';
        description = 'Você está com sobrepeso. Considere uma dieta equilibrada e exercícios.';
        colorClass = 'bmi-overweight';
    } else if (bmi >= 30 && bmi < 35) {
        category = 'Obesidade Grau I';
        description = 'Obesidade grau I. Recomenda-se acompanhamento médico e nutricional.';
        colorClass = 'bmi-obese1';
    } else if (bmi >= 35 && bmi < 40) {
        category = 'Obesidade Grau II';
        description = 'Obesidade grau II. É importante buscar acompanhamento médico.';
        colorClass = 'bmi-obese2';
    } else {
        category = 'Obesidade Grau III';
        description = 'Obesidade grau III. Procure acompanhamento médico urgente.';
        colorClass = 'bmi-obese3';
    }
    
    return {
        bmi: parseFloat(bmi.toFixed(1)),
        category,
        description,
        colorClass
    };
}

function showBMIResult(result) {
    document.getElementById('bmi-value').textContent = result.bmi.toFixed(1);
    document.getElementById('bmi-category').textContent = result.category;
    document.getElementById('bmi-description').textContent = result.description;
    
    // Destacar categoria na tabela
    const ranges = document.querySelectorAll('.bmi-range');
    ranges.forEach(range => range.classList.remove('active'));
    
    const activeRange = document.querySelector(`.${result.colorClass}`);
    if (activeRange) {
        activeRange.classList.add('active');
    }
    
    document.getElementById('bmi-result').classList.remove('hidden');
}

function validateBMIData(weight, height) {
    const errors = {};
    
    if (!weight || weight <= 0) {
        errors.weight = 'Peso deve ser maior que zero';
    } else if (weight > 500) {
        errors.weight = 'Peso máximo é 500kg';
    }
    
    if (!height || height <= 0) {
        errors.height = 'Altura deve ser maior que zero';
    } else if (height < 50) {
        errors.height = 'Altura mínima é 50cm';
    } else if (height > 250) {
        errors.height = 'Altura máxima é 250cm';
    }
    
    return errors;
}

function resetBMI() {
    document.getElementById('bmi-weight').value = '';
    document.getElementById('bmi-height').value = '';
    document.getElementById('bmi-result').classList.add('hidden');
    clearErrors('bmi');
    
    // Remover destaque da tabela
    const ranges = document.querySelectorAll('.bmi-range');
    ranges.forEach(range => range.classList.remove('active'));
}

// Funções de cálculo de Proteína
function selectGender(gender) {
    selectedGender = gender;
    
    const options = document.querySelectorAll('.gender-option');
    options.forEach(option => option.classList.remove('active'));
    
    event.target.classList.add('active');
    
    // Limpar erro
    document.getElementById('protein-gender-error').classList.add('hidden');
    document.getElementById('protein-gender-error').textContent = '';
}

function selectActivity(activity) {
    selectedActivity = activity;
    
    const options = document.querySelectorAll(".activity-option");
    options.forEach(option => option.classList.remove("active"));
    
    const clickedOption = event.target.closest(".activity-option");
    if (clickedOption) {
        clickedOption.classList.add("active");
    }
    
    // Limpar erro
    document.getElementById("protein-activity-error").classList.add("hidden");
    document.getElementById("protein-activity-error").textContent = "";
}

function calculateProtein() {
    const weight = parseFloat(document.getElementById('protein-weight').value);
    const height = parseFloat(document.getElementById('protein-height').value);
    const age = parseInt(document.getElementById('protein-age').value);
    
    // Limpar erros anteriores
    clearErrors('protein');
    
    // Validação
    const errors = validateProteinData(weight, height, age, selectedGender, selectedActivity);
    
    if (Object.keys(errors).length > 0) {
        showErrors('protein', errors);
        document.getElementById('protein-result').classList.add('hidden');
        return;
    }
    
    // Cálculo
    const result = calculateProteinValue(weight, height, age, selectedGender, selectedActivity);
    
    // Mostrar resultado
    showProteinResult(result);
    
    // Scroll para resultado
    setTimeout(() => {
        document.getElementById('protein-result').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

function calculateProteinValue(weight, height, age, gender, activityLevel) {
    // TMB usando Harris-Benedict revisada
    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Fatores de atividade
    const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extra: 1.9
    };

    const tdee = bmr * activityFactors[activityLevel];

    // Proteína por kg baseada na atividade
    const proteinFactors = {
        sedentary: 0.8,
        light: 1.0,
        moderate: 1.2,
        active: 1.6,
        extra: 2.0
    };

    const proteinPerKg = proteinFactors[activityLevel];
    const dailyProtein = weight * proteinPerKg;

    // Descrição personalizada
    const descriptions = {
        sedentary: 'Para seu estilo de vida sedentário, esta quantidade de proteína é suficiente para manter suas funções corporais básicas.',
        light: 'Com atividade física leve, você precisa de um pouco mais de proteína para recuperação muscular.',
        moderate: 'Seu nível moderado de atividade requer proteína adicional para suportar o crescimento e reparo muscular.',
        active: 'Como você é muito ativo, precisa de bastante proteína para otimizar a recuperação e o desempenho.',
        extra: 'Seu nível extremo de atividade demanda alta ingestão de proteína para máxima recuperação e crescimento muscular.'
    };

    return {
        dailyProtein: parseFloat(dailyProtein.toFixed(1)),
        proteinPerKg: parseFloat(proteinPerKg.toFixed(1)),
        bmr: parseFloat(bmr.toFixed(0)),
        tdee: parseFloat(tdee.toFixed(0)),
        description: descriptions[activityLevel]
    };
}

function showProteinResult(result) {
    document.getElementById('protein-value').textContent = Math.round(result.dailyProtein) + 'g';
    document.getElementById('protein-per-kg').textContent = result.proteinPerKg.toFixed(1) + 'g por kg de peso';
    document.getElementById('protein-description').textContent = result.description;
    
    document.getElementById('protein-result').classList.remove('hidden');
}

function validateProteinData(weight, height, age, gender, activityLevel) {
    const errors = {};
    
    if (!weight || weight <= 0) {
        errors.weight = 'Peso deve ser maior que zero';
    } else if (weight > 500) {
        errors.weight = 'Peso máximo é 500kg';
    }
    
    if (!height || height <= 0) {
        errors.height = 'Altura deve ser maior que zero';
    } else if (height < 50) {
        errors.height = 'Altura mínima é 50cm';
    } else if (height > 250) {
        errors.height = 'Altura máxima é 250cm';
    }

    if (!age || age <= 0) {
        errors.age = 'Idade deve ser maior que zero';
    } else if (age < 10) {
        errors.age = 'Idade mínima é 10 anos';
    } else if (age > 120) {
        errors.age = 'Idade máxima é 120 anos';
    }

    if (!gender) {
        errors.gender = 'Selecione o sexo';
    }

    if (!activityLevel) {
        errors.activityLevel = 'Selecione o nível de atividade física';
    }
    
    return errors;
}

function resetProtein() {
    document.getElementById('protein-weight').value = '';
    document.getElementById('protein-height').value = '';
    document.getElementById('protein-age').value = '';
    document.getElementById('protein-result').classList.add('hidden');
    
    // Resetar seleções
    selectedGender = '';
    selectedActivity = '';
    
    const genderOptions = document.querySelectorAll('.gender-option');
    genderOptions.forEach(option => option.classList.remove('active'));
    
    const activityOptions = document.querySelectorAll('.activity-option');
    activityOptions.forEach(option => option.classList.remove('active'));
    
    clearErrors('protein');
}

// Funções utilitárias
function clearErrors(type) {
    const errorElements = document.querySelectorAll(`[id^="${type}-"][id$="-error"]`);
    errorElements.forEach(element => {
        element.classList.add('hidden');
        element.textContent = '';
    });
    
    const inputElements = document.querySelectorAll(`[id^="${type}-"]`);
    inputElements.forEach(element => {
        if (element.classList.contains('form-input')) {
            element.classList.remove('error');
        }
    });
}

function showErrors(type, errors) {
    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${type}-${field}-error`);
        const inputElement = document.getElementById(`${type}-${field}`);
        
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.classList.remove('hidden');
        }
        
        if (inputElement && inputElement.classList.contains('form-input')) {
            inputElement.classList.add('error');
        }
        
        // Para campos especiais
        if (field === 'gender') {
            const errorElement = document.getElementById('protein-gender-error');
            errorElement.textContent = errors[field];
            errorElement.classList.remove('hidden');
        }
        
        if (field === 'activityLevel') {
            const errorElement = document.getElementById('protein-activity-error');
            errorElement.textContent = errors[field];
            errorElement.classList.remove('hidden');
        }
    });
}

// Smooth scrolling para links de navegação
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animações ao scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos com animação
    document.querySelectorAll('.fade-in, .fade-in-delay-1, .fade-in-delay-2, .fade-in-delay-3').forEach(el => {
        observer.observe(el);
    });
});
