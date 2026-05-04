const countriesData = {
    'MA': {
        name: 'Maroc', flag: '🇲🇦', currency: 'MAD',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme à la loi 18-00 relative au statut de la copropriété au Maroc.",
        prices: {
            'cloud-monthly': 200,
            'cloud-yearly': 2000,
            'desktop-monthly': 300,
            'desktop-yearly': 3000,
            'desktop-lifetime': 5000
        }
    },
    'FR': {
        name: 'France', flag: '🇫🇷', currency: 'EUR',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme à la loi ALUR et à la loi ELAN en France.",
        prices: {
            'cloud-monthly': 20,
            'cloud-yearly': 200,
            'desktop-monthly': 30,
            'desktop-yearly': 300,
            'desktop-lifetime': 500
        }
    },
    'BE': {
        name: 'Belgique', flag: '🇧🇪', currency: 'EUR',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme au Code civil belge régissant la copropriété.",
        prices: {
            'cloud-monthly': 20,
            'cloud-yearly': 200,
            'desktop-monthly': 30,
            'desktop-yearly': 300,
            'desktop-lifetime': 500
        }
    },
    'CH': {
        name: 'Suisse', flag: '🇨🇭', currency: 'CHF',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme au Code civil suisse (art. 712a et suivants).",
        prices: {
            'cloud-monthly': 25,
            'cloud-yearly': 250,
            'desktop-monthly': 35,
            'desktop-yearly': 350,
            'desktop-lifetime': 550
        }
    },
    'CA': {
        name: 'Québec', flag: '🇨🇦', currency: 'CAD',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme à la loi 16 et la loi 141 au Québec.",
        prices: {
            'cloud-monthly': 30,
            'cloud-yearly': 300,
            'desktop-monthly': 40,
            'desktop-yearly': 400,
            'desktop-lifetime': 600
        }
    },
    'SN': {
        name: 'Sénégal', flag: '🇸🇳', currency: 'FCFA',
        heroSubtitle: "La plateforme B2B la plus moderne pour les syndics. 100% conforme aux réglementations de copropriété au Sénégal.",
        prices: {
            'cloud-monthly': 15000,
            'cloud-yearly': 150000,
            'desktop-monthly': 20000,
            'desktop-yearly': 200000,
            'desktop-lifetime': 350000
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initCountrySelector();
    detectUserCountry();
    loadBlogPosts();
});

async function loadBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return;

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Network response was not ok');
        const posts = await response.json();

        if (posts.length === 0) {
            blogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">Aucun article publié pour le moment.</div>';
            return;
        }

        blogGrid.innerHTML = ''; // Clear loading text
        
        // Show max 3 posts
        posts.slice(0, 3).forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            
            // Extract a snippet of text from the HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content;
            const snippet = post.metaDesc || (tempDiv.textContent.substring(0, 100) + '...');
            
            const imageUrl = post.image || 'assets/blog-placeholder.jpg';

            card.innerHTML = `
                <div style="height: 200px; background: #e2e8f0; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/400x200?text=SyndiKi+News'">
                </div>
                <div style="padding: 24px;">
                    <span style="color: var(--primary); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">${post.category}</span>
                    <h3 style="margin: 10px 0; font-size: 1.25rem;">${post.title}</h3>
                    <p style="color: var(--text-dim); margin-bottom: 20px;">${snippet}</p>
                    <a href="article.html?slug=${post.slug}" style="color: var(--text-main); font-weight: 600; text-decoration: none;">Lire l'article &rarr;</a>
                </div>
            `;
            blogGrid.appendChild(card);
        });

    } catch (e) {
        console.error('Erreur lors du chargement des articles', e);
        // Fallback or silently fail (leave empty state)
        blogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">Erreur de chargement des articles.</div>';
    }
}

function initCountrySelector() {
    const toggle = document.getElementById('countryToggle');
    const dropdown = document.getElementById('countryDropdown');
    const options = document.querySelectorAll('.country-option');

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const code = opt.getAttribute('data-country');
            setCountry(code);
        });
    });
}

async function detectUserCountry() {
    const savedCountry = localStorage.getItem('syndiki_country');
    if (savedCountry && countriesData[savedCountry]) {
        setCountry(savedCountry);
        return;
    }

    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const code = data.country_code;
        
        if (countriesData[code]) {
            setCountry(code);
        } else {
            setCountry('MA'); // Default
        }
    } catch (e) {
        setCountry('MA');
    }
}

function setCountry(code) {
    if (!countriesData[code]) code = 'MA';
    const data = countriesData[code];

    // Update Dropdown UI
    document.getElementById('currentCountryFlag').textContent = data.flag;
    document.getElementById('currentCountryCode').textContent = code;
    
    document.querySelectorAll('.country-option').forEach(opt => {
        opt.classList.remove('active');
        if(opt.getAttribute('data-country') === code) {
            opt.classList.add('active');
        }
    });

    // Update Legal Text
    const legalHeroText = document.getElementById('legalHeroText');
    if(legalHeroText) legalHeroText.textContent = data.heroSubtitle;

    // Update Prices and Currency
    document.querySelectorAll('.currency').forEach(el => el.textContent = data.currency);
    document.querySelectorAll('.price[data-plan], .plan-price[data-plan]').forEach(el => {
        const plan = el.getAttribute('data-plan');
        if (data.prices && data.prices[plan] !== undefined) {
            el.innerHTML = `${data.prices[plan]} <span class="currency">${data.currency}</span>`;
        }
    });

    // Desktop sections remain visible globally, no logic needed here.

    localStorage.setItem('syndiki_country', code);
}
