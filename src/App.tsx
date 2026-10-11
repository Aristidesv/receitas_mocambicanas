import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Heart,
  ImagePlus,
  Leaf,
  Moon,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Sun,
  Trash2,
  UtensilsCrossed,
  UserRound,
  X,
} from 'lucide-react';

type Category = 'Todas' | 'Rapidas' | 'Conforto' | 'Vegetarianas' | 'Doces';

type Recipe = {
  id: string;
  name: string;
  category: Exclude<Category, 'Todas'>;
  description: string;
  time: string;
  servings: string;
  image: string;
  ingredients: [string, string][];
  steps: string[];
  tip: string;
  isUserCreated?: boolean;
  isOwner?: boolean;
  photo?: string;
  videoUrl?: string;
  authorName?: string;
  authorPhoto?: string;
  authorCountry?: string;
  authorEmail?: string;
  authorAddress?: string;
};

type AuthorProfile = {
  name: string;
  email: string;
  photo: string;
  country: string;
  address: string;
  hasRecoveryAnswer: boolean;
};

type RecipeFormState = {
  name: string;
  category: Exclude<Category, 'Todas'>;
  description: string;
  time: string;
  servings: string;
  ingredients: string;
  steps: string;
  tip: string;
  photo: string;
  videoUrl: string;
};

type RecipeComment = {
  id: number;
  recipeId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

const emptyRecipeForm: RecipeFormState = {
  name: '',
  category: 'Rapidas',
  description: '',
  time: '30 min',
  servings: '2 porcoes',
  ingredients: '',
  steps: '',
  tip: '',
  photo: '',
  videoUrl: '',
};

const emptyAuthorProfile: AuthorProfile = {
  name: '',
  email: '',
  photo: '',
  country: '',
  address: '',
  hasRecoveryAnswer: false,
};

const recipes: Recipe[] = [
  {
    id: 'nhoque-abobora',
    name: 'Nhoque de abóbora com sálvia',
    category: 'Vegetarianas',
    description: 'Macio, dourado e com aquele perfume de manteiga que abraça a cozinha.',
    time: '45 min',
    servings: '2 porcoes',
    image: 'dish-gold',
    ingredients: [['Abóbora cabotiá assada', '500 g'], ['Farinha de trigo', '1 xícara'], ['Manteiga', '2 colheres'], ['Folhas de sálvia', '8 unidades'], ['Parmesão ralado', '½ xícara'], ['Sal e noz-moscada', 'a gosto']],
    steps: ['Asse a abóbora até ficar bem macia e amasse ainda quente. Espere esfriar um pouco.', 'Junte a farinha, o sal e a noz-moscada aos poucos, apenas até formar uma massa macia.', 'Faça rolinhos, corte os nhoques e cozinhe em água fervente até subirem à superfície.', 'Doure a manteiga com a sálvia, envolva os nhoques e finalize com parmesão.'],
    tip: 'Quanto menos farinha, mais leve o nhoque. A abóbora deve estar bem sequinha antes de entrar na massa.',
  },
  {
    id: 'arroz-forno',
    name: 'Arroz de forno da casa',
    category: 'Conforto',
    description: 'A receita que transforma sobras honestas em um almoço cheio de sabor.',
    time: '35 min',
    servings: '4 porcoes',
    image: 'dish-tomato',
    ingredients: [['Arroz cozido', '3 xícaras'], ['Frango desfiado', '300 g'], ['Milho verde', '½ lata'], ['Tomate picado', '2 unidades'], ['Muçarela', '150 g'], ['Cheiro-verde', 'a gosto']],
    steps: ['Refogue o tomate até desmanchar e junte o frango, o milho e o cheiro-verde.', 'Misture o refogado ao arroz cozido, ajustando o sal e a pimenta.', 'Espalhe em uma assadeira, cubra com a muçarela e leve ao forno alto.', 'Asse por 15 minutos, até o queijo borbulhar e ganhar pontinhos dourados.'],
    tip: 'Um fio de azeite sobre o queijo antes de assar deixa a cobertura mais dourada.',
  },
  {
    id: 'salada-grao',
    name: 'Salada morna de grão-de-bico',
    category: 'Rapidas',
    description: 'Fresca, substanciosa e pronta antes que a fome vire urgência.',
    time: '20 min',
    servings: '2 porcoes',
    image: 'dish-green',
    ingredients: [['Grão-de-bico cozido', '2 xícaras'], ['Tomate-cereja', '1 xícara'], ['Pepino', '½ unidade'], ['Cebola roxa', '½ unidade'], ['Limão-siciliano', '1 unidade'], ['Hortelã e azeite', 'a gosto']],
    steps: ['Aqueça o grão-de-bico em uma frigideira com azeite e uma pitada de páprica.', 'Corte os vegetais e coloque em uma tigela grande.', 'Junte o grão-de-bico ainda morno e tempere com limão, azeite e sal.', 'Finalize com folhas de hortelã e sirva imediatamente.'],
    tip: 'A mistura de temperaturas deixa a salada mais aromática e faz o molho penetrar melhor.',
  },
  {
    id: 'curry-legumes',
    name: 'Curry de legumes e coco',
    category: 'Vegetarianas',
    description: 'Colorido, perfumado e com molho suficiente para pedir arroz.',
    time: '30 min',
    servings: '3 porcoes',
    image: 'dish-blue',
    ingredients: [['Leite de coco', '200 ml'], ['Batata-doce', '1 unidade'], ['Cenoura', '1 unidade'], ['Brócolis', '1 xícara'], ['Pasta de curry', '1 colher'], ['Coentro fresco', 'a gosto']],
    steps: ['Doure a batata-doce e a cenoura em cubos com óleo e sal.', 'Junte a pasta de curry e mexa por um minuto para liberar os aromas.', 'Adicione o leite de coco e cozinhe até os legumes ficarem macios.', 'Entre com o brócolis nos minutos finais e finalize com coentro.'],
    tip: 'O brócolis entra por último para continuar verde e ligeiramente crocante.',
  },
  {
    id: 'massa-limao',
    name: 'Massa cremosa de limão',
    category: 'Rapidas',
    description: 'Um jantar de uma panela só, ácido na medida e surpreendentemente elegante.',
    time: '25 min',
    servings: '2 porcoes',
    image: 'dish-plum',
    ingredients: [['Massa curta', '250 g'], ['Creme de leite', '1 caixinha'], ['Limão-taiti', '2 unidades'], ['Alho', '1 dente'], ['Parmesão', '½ xícara'], ['Pimenta-do-reino', 'a gosto']],
    steps: ['Cozinhe a massa em água salgada e reserve uma xícara da água do cozimento.', 'Doure o alho no azeite e desligue o fogo antes de juntar o creme.', 'Misture a massa, o creme, as raspas e o suco dos limões.', 'Ajuste a textura com a água reservada e finalize com parmesão e pimenta.'],
    tip: 'Raspe o limão antes de espremê-lo. A parte colorida da casca guarda o perfume, não o amargor.',
  },
];

const categories: Category[] = ['Todas', 'Rapidas', 'Conforto', 'Vegetarianas', 'Doces'];
const recipeCategories: Exclude<Category, 'Todas'>[] = ['Rapidas', 'Conforto', 'Vegetarianas', 'Doces'];
const recipeImages: Record<Exclude<Category, 'Todas'>, Recipe['image']> = {
  Rapidas: 'dish-green',
  Conforto: 'dish-tomato',
  Vegetarianas: 'dish-gold',
  Doces: 'dish-clay',
};
const baseRatings: Record<string, { average: number; count: number }> = {
  'nhoque-abobora': { average: 4.9, count: 42 },
  'arroz-forno': { average: 4.7, count: 28 },
  'salada-grao': { average: 4.8, count: 35 },
  'bolo-fuba': { average: 4.9, count: 51 },
  'curry-legumes': { average: 4.6, count: 19 },
  'massa-limao': { average: 4.8, count: 31 },
};

const recipeToForm = (recipe: Recipe): RecipeFormState => {
  return {
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    time: recipe.time,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map(([name, amount]) => `${name} | ${amount}`).join('\n'),
    steps: recipe.steps.join('\n'),
    tip: recipe.tip,
    photo: recipe.photo ?? '',
    videoUrl: recipe.videoUrl ?? '',
  };
};

function updateMetaTag(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function Stars({ value, interactive = false, onRate, label }: { value: number; interactive?: boolean; onRate?: (score: number) => void; label: string }) {
  return (
    <div className={`star-row ${interactive ? 'interactive' : ''}`} aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = <Star size={interactive ? 20 : 13} fill={star <= value ? 'currentColor' : 'none'} />;
        return interactive ? (
          <button key={star} type="button" onClick={() => onRate?.(star)} aria-label={`Dar ${star} ${star === 1 ? 'estrela' : 'estrelas'}`}>
            {icon}
          </button>
        ) : <span key={star}>{icon}</span>;
      })}
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Todas');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('receitas-favoritas') || '[]');
    } catch {
      return [];
    }
  });
  const [userRecipes, setUserRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('receitas-minhas') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('receitas-avaliacoes') || '{}');
      return stored && typeof stored === 'object' ? stored : {};
    } catch {
      return {};
    }
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('receitas-tema') === 'escuro');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [formError, setFormError] = useState('');
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [profileForm, setProfileForm] = useState<AuthorProfile>(emptyAuthorProfile);
  const [favoriteFood, setFavoriteFood] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authPassword, setAuthPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const title = selectedRecipe
      ? `${selectedRecipe.name} | a mesa`
      : 'a mesa - receitas para todos os dias';
    const description = selectedRecipe
      ? selectedRecipe.description
      : 'Descubra receitas simples para todos os dias. Pesquise por ingredientes, guarde as suas favoritas e partilhe as suas criações na a mesa.';
    const canonicalUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const pageUrl = selectedRecipe ? `${canonicalUrl}#receita=${encodeURIComponent(selectedRecipe.id)}` : canonicalUrl;
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    document.title = title;
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', selectedRecipe ? 'article' : 'website');
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', pageUrl);
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    document.getElementById('recipe-structured-data')?.remove();
    if (selectedRecipe) {
      const minutes = selectedRecipe.time.match(/(\d+)\s*min/i)?.[1];
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: selectedRecipe.name,
        description: selectedRecipe.description,
        recipeCategory: selectedRecipe.category,
        recipeYield: selectedRecipe.servings,
        recipeIngredient: selectedRecipe.ingredients.map(([name, amount]) => `${amount} ${name}`),
        recipeInstructions: selectedRecipe.steps.map((text) => ({ '@type': 'HowToStep', text })),
        ...(minutes ? { totalTime: `PT${minutes}M` } : {}),
        ...(selectedRecipe.authorName ? { author: { '@type': 'Person', name: selectedRecipe.authorName } } : {}),
      };
      const script = document.createElement('script');
      script.id = 'recipe-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById('recipe-structured-data')?.remove();
    };
  }, [selectedRecipe]);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<AuthorProfile>;
      })
      .then((profile) => {
        if (active && profile) {
          setAuthorProfile({ ...emptyAuthorProfile, ...profile, photo: profile.photo ?? '', country: profile.country ?? '', address: profile.address ?? '' });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('receitas-favoritas', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('receitas-minhas', JSON.stringify(userRecipes));
  }, [userRecipes]);

  useEffect(() => {
    let active = true;

    const synchronizeRecipes = async () => {
      try {
        const response = await fetch('/api/recipes');
        if (!response.ok) throw new Error('Não foi possível carregar as receitas do banco de dados.');
        const savedRecipes: Recipe[] = await response.json();
        if (active) setUserRecipes(savedRecipes);
      } catch {
        if (active) setToast('Banco indisponível. Confira o PostgreSQL e a configuração DATABASE_URL.');
      }
    };

    synchronizeRecipes();
    return () => { active = false; };
  }, [authorProfile?.email]);

  useEffect(() => {
    localStorage.setItem('receitas-avaliacoes', JSON.stringify(userRatings));
  }, [userRatings]);

  useEffect(() => {
    localStorage.setItem('receitas-tema', darkMode ? 'escuro' : 'claro');
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = selectedRecipe || editorOpen || profileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editorOpen, profileOpen, selectedRecipe]);

  useEffect(() => {
    if (!selectedRecipe) {
      setComments([]);
      setCommentError('');
      return;
    }

    let active = true;
    setCommentError('');
    fetch(`/api/recipes/${encodeURIComponent(selectedRecipe.id)}/comments`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os comentários.');
        return response.json() as Promise<RecipeComment[]>;
      })
      .then((savedComments) => { if (active) setComments(savedComments); })
      .catch(() => { if (active) setCommentError('Comentários indisponíveis. Verifique a conexão com o banco de dados.'); });

    return () => { active = false; };
  }, [selectedRecipe?.id]);

  const allRecipes = useMemo(() => [...userRecipes, ...recipes], [userRecipes]);

  const getRecipeRating = (recipe: Recipe) => {
    const base = baseRatings[recipe.id] ?? { average: 0, count: 0 };
    const personalRating = userRatings[recipe.id];
    if (!personalRating) return base;
    return {
      average: base.count === 0
        ? personalRating
        : (base.average * base.count + personalRating) / (base.count + 1),
      count: base.count + 1,
    };
  };

  const visibleRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return allRecipes.filter((recipe) => {
      const matchesCategory = category === 'Todas' || recipe.category === category;
      const searchable = `${recipe.name} ${recipe.description} ${recipe.ingredients.flat().join(' ')}`.toLocaleLowerCase('pt-BR');
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFavorites = !showFavorites || favorites.includes(recipe.id);
      return matchesCategory && matchesQuery && matchesFavorites;
    });
  }, [allRecipes, category, favorites, query, showFavorites]);

  const toggleFavorite = (recipe: Recipe) => {
    const isSaved = favorites.includes(recipe.id);
    setFavorites((current) => isSaved ? current.filter((id) => id !== recipe.id) : [...current, recipe.id]);
    setToast(isSaved ? `${recipe.name} saiu dos seus guardados.` : `${recipe.name} foi guardada para depois.`);
  };

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#receita=${recipe.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeRecipe = () => {
    setSelectedRecipe(null);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  useEffect(() => {
    const sharedId = window.location.hash.startsWith('#receita=') ? window.location.hash.replace('#receita=', '') : '';
    if (sharedId) {
      const sharedRecipe = allRecipes.find((recipe) => recipe.id === sharedId);
      if (sharedRecipe) setSelectedRecipe(sharedRecipe);
    }
  }, [allRecipes]);

  const openEditor = (recipe?: Recipe) => {
    setEditingRecipe(recipe ?? null);
    setRecipeForm(recipe ? recipeToForm(recipe) : emptyRecipeForm);
    setFormError('');
    setSelectedRecipe(null);
    setEditorOpen(true);
  };

  const openProfile = () => {
    setProfileForm(authorProfile ?? emptyAuthorProfile);
    setProfileError('');
    setAuthPassword('');
    setFavoriteFood('');
    setNewPassword('');
    setConfirmNewPassword('');
    setAuthMode('login');
    setProfileOpen(true);
  };

  const updateRecipeForm = (field: keyof RecipeFormState, value: string) => {
    setRecipeForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError('');
  };

  const saveRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ingredients = recipeForm.ingredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...amountParts] = line.split('|');
        return [name.trim(), amountParts.join('|').trim() || 'a gosto'] as [string, string];
      });
    const steps = recipeForm.steps.split('\n').map((step) => step.trim()).filter(Boolean);

    if (!recipeForm.name.trim()) {
      setFormError('Dê um nome para a sua receita.');
      return;
    }
    if (ingredients.length === 0) {
      setFormError('Adicione pelo menos um ingrediente.');
      return;
    }
    if (steps.length === 0) {
      setFormError('Adicione pelo menos um passo de preparo.');
      return;
    }
    if (!authorProfile) {
      setEditorOpen(false);
      openProfile();
      setToast('Cadastre seu perfil antes de publicar uma receita.');
      return;
    }

    const savedRecipe: Recipe = {
      id: editingRecipe?.id ?? `minha-receita-${Date.now()}`,
      name: recipeForm.name.trim(),
      category: recipeForm.category,
      description: recipeForm.description.trim() || 'Uma receita feita na sua cozinha.',
      time: recipeForm.time.trim() || '30 min',
      servings: recipeForm.servings.trim() || '2 porcoes',
      image: editingRecipe?.image ?? recipeImages[recipeForm.category],
      ingredients,
      steps,
      tip: recipeForm.tip.trim() || 'Prepare com calma e ajuste os temperos ao seu gosto.',
      isUserCreated: true,
      isOwner: true,
      photo: recipeForm.photo,
      videoUrl: recipeForm.videoUrl.trim(),
      authorName: authorProfile.name,
      authorPhoto: authorProfile.photo,
      authorCountry: authorProfile.country,
      authorEmail: authorProfile.email,
    };

    try {
      const recipePayload = {
        ...savedRecipe,
        authorName: undefined,
        authorPhoto: undefined,
        authorCountry: undefined,
        authorAddress: undefined,
        authorEmail: authorProfile.email,
      };
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || `Não foi possível salvar a receita (HTTP ${response.status}).`);
      }
    } catch (error) {
      setFormError(error instanceof TypeError
        ? 'Não foi possível alcançar a API. Confira se o servidor está ativo e se o celular está na mesma rede.'
        : error instanceof Error ? error.message : 'Não foi possível salvar a receita.');
      return;
    }

    setUserRecipes((current) => editingRecipe
      ? current.map((recipe) => recipe.id === editingRecipe.id ? savedRecipe : recipe)
      : [savedRecipe, ...current]);
    setEditorOpen(false);
    setEditingRecipe(null);
    setToast(editingRecipe ? 'Receita atualizada com carinho.' : 'Receita guardada na sua cozinha.');
    setShowFavorites(false);
    setCategory('Todas');
    setQuery('');
  };

  const deleteRecipe = async (recipe: Recipe) => {
    if (!window.confirm(`Excluir "${recipe.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const response = await fetch(`/api/recipes/${encodeURIComponent(recipe.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Não foi possível excluir a receita.');
    } catch {
      setToast('Não foi possível excluir a receita do banco de dados.');
      return;
    }
    setUserRecipes((current) => current.filter((item) => item.id !== recipe.id));
    setFavorites((current) => current.filter((id) => id !== recipe.id));
    closeRecipe();
    setToast('Receita excluída.');
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecipe) return;
    const content = commentText.trim();
    if (!authorProfile || !content) {
      setCommentError('Entre na sua conta e escreva um comentário.');
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${encodeURIComponent(selectedRecipe.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Não foi possível publicar o comentário.');
      setComments((current) => [result as RecipeComment, ...current]);
      setCommentText('');
      setCommentError('');
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Não foi possível publicar o comentário.');
    }
  };

  const rateRecipe = (recipe: Recipe, score: number) => {
    setUserRatings((current) => ({ ...current, [recipe.id]: score }));
    setToast(`Você avaliou ${recipe.name} com ${score} ${score === 1 ? 'estrela' : 'estrelas'}.`);
  };

  const shareRecipe = async (recipe: Recipe) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#receita=${recipe.id}`;
    const shareData = {
      title: `${recipe.name} · à mesa`,
      text: `${recipe.name}: ${recipe.description}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setToast('Link da receita copiado.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setToast('Não foi possível compartilhar agora.');
    }
  };

  const handlePhotoChange = (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError('Escolha uma foto de até 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateRecipeForm('photo', typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleAuthorPhotoChange = (file?: File) => {
    if (!file) return;
    if (file.size > 512 * 1024) {
      setFormError('A foto do perfil deve ter até 512 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileForm((current) => ({ ...current, photo: typeof reader.result === 'string' ? reader.result : '' }));
    reader.readAsDataURL(file);
  };

  const saveAuthorProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authorProfile) return;
    const profile = {
      name: profileForm.name.trim(),
      photo: profileForm.photo,
      country: profileForm.country.trim(),
      address: profileForm.address.trim(),
      favoriteFood: favoriteFood.trim(),
    };
    if (!profile.name) {
      setProfileError('Informe seu nome.');
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `Não foi possível guardar o perfil (HTTP ${response.status}).`);
      const savedProfile: AuthorProfile = {
        name: result.name,
        email: authorProfile.email,
        photo: result.photo ?? '',
        country: result.country ?? '',
        address: result.address ?? '',
        hasRecoveryAnswer: Boolean(result.hasRecoveryAnswer),
      };
      setAuthorProfile(savedProfile);
      setProfileForm(savedProfile);
      setFavoriteFood('');
      setProfileOpen(false);
      setToast('Perfil atualizado.');
    } catch (error) {
      setProfileError(error instanceof TypeError
        ? 'Não foi possível alcançar o servidor. Confira a conexão de rede.'
        : error instanceof Error ? error.message : 'Não foi possível guardar o perfil.');
    }
  };

  const authenticate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    const payload = authMode === 'register'
      ? { ...profileForm, name: profileForm.name.trim(), email: profileForm.email.trim().toLowerCase(), password: authPassword, favoriteFood: favoriteFood.trim() }
      : { email: profileForm.email.trim().toLowerCase(), password: authPassword };

    try {
      const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `Não foi possível ${authMode === 'register' ? 'criar a conta' : 'entrar'} (HTTP ${response.status}).`);
      const authenticatedProfile: AuthorProfile = {
        name: result.name,
        email: result.email,
        photo: result.photo ?? '',
        country: result.country ?? '',
        address: result.address ?? '',
        hasRecoveryAnswer: Boolean(result.hasRecoveryAnswer),
      };
      setAuthorProfile(authenticatedProfile);
      setProfileForm(authenticatedProfile);
      setAuthPassword('');
      setFavoriteFood('');
      setProfileOpen(false);
      setToast(authMode === 'register' ? 'Conta criada. Você já está conectado.' : 'Sessão iniciada.');
    } catch (error) {
      setProfileError(error instanceof TypeError
        ? 'Não foi possível alcançar o servidor. Confira sua conexão.'
        : error instanceof Error ? error.message : 'Não foi possível autenticar.');
    }
  };

  const recoverAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    if (newPassword !== confirmNewPassword) {
      setProfileError('As senhas não coincidem.');
      return;
    }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileForm.email.trim().toLowerCase(),
          favoriteFood: favoriteFood.trim(),
          password: newPassword,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Email, resposta ou senha inválidos.');
      setAuthMode('login');
      setFavoriteFood('');
      setNewPassword('');
      setConfirmNewPassword('');
      setProfileForm((current) => ({ ...current, hasRecoveryAnswer: true }));
      setToast(result.message || 'Senha alterada. Entre com a nova senha.');
    } catch (error) {
      setProfileError(error instanceof TypeError
        ? 'Não foi possível alcançar o servidor. Confira sua conexão.'
        : error instanceof Error ? error.message : 'Email, resposta ou senha inválidos.');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthorProfile(null);
      setProfileForm(emptyAuthorProfile);
      setProfileOpen(false);
      setToast('Sessão encerrada.');
    }
  };

  const resetFilters = () => {
    setQuery('');
    setCategory('Todas');
    setShowFavorites(false);
  };

  const isPasswordRecovery = authMode === 'forgot';

  return (
    <div className={`recipe-app ${darkMode ? 'dark-theme' : ''}`}>
      <div className="grain" aria-hidden="true" />
      <main className="app-shell">
        <header className="topbar">
          <button className="brand" onClick={resetFilters} data-testid="button-home">
            <span className="brand-mark"><UtensilsCrossed size={17} strokeWidth={2.2} /></span>
            <span className="brand-name">a mesa</span>
          </button>
          <span className="topbar-note">receitas para todos os dias</span>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? 'Ativar tema claro' : 'Ativar tema escuro'} data-testid="button-theme">
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button className={`favorites-link ${showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites((value) => !value)} data-testid="button-favorites">
              <Heart size={16} fill={showFavorites ? 'currentColor' : 'none'} />
              <span>Guardadas</span>
              {favorites.length > 0 && <span className="favorites-count" data-testid="text-favorites-count">{favorites.length}</span>}
            </button>
            <button className="profile-link" onClick={openProfile} data-testid="button-profile">
              {authorProfile?.photo ? <img src={authorProfile.photo} alt="" /> : <UserRound size={15} />}
              <span>{authorProfile?.name || 'Entrar'}</span>
            </button>
          </div>
        </header>

        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">cozinhar sem complicar</p>
            <h1 id="page-title">O que vai para a mesa <em>hoje?</em></h1>
            <p className="hero-copy">Receitas gostosas, possíveis e escolhidas para o ritmo da vida real. Encontre uma ideia e comece por onde estiver.</p>
          </div>
          <div className="hero-stamp" aria-hidden="true">
            <div className="stamp-copy">feito para repetir<small>caderno 01 · cozinha afetiva</small></div>
          </div>
        </section>

        <section className="search-panel" aria-label="Encontrar receitas">
          <label className="search-box">
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por receita ou ingrediente..." aria-label="Buscar por receita ou ingrediente" data-testid="input-search" />
            {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Limpar busca" data-testid="button-clear-search"><X size={15} /></button>}
          </label>
          <div className="category-list" role="tablist" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <button key={item} className={`category-pill ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)} role="tab" aria-selected={category === item} data-testid={`filter-category-${item.toLowerCase()}`}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section aria-live="polite">
          <div className="section-heading">
            <h2>{showFavorites ? 'Suas receitas guardadas' : query ? 'Encontramos isto' : 'Para começar hoje'}</h2>
            <div className="section-actions">
              <button className="new-recipe-button" onClick={() => openEditor()} data-testid="button-new-recipe">
                <Plus size={15} /> <span>Nova receita</span>
              </button>
              {!isLoading && <span className="result-count" data-testid="text-result-count">{visibleRecipes.length} {visibleRecipes.length === 1 ? 'receita' : 'receitas'}</span>}
            </div>
          </div>
          {isLoading ? (
            <div className="skeleton-grid" aria-label="Carregando receitas">
              {[1, 2, 3].map((item) => <div className="skeleton-card" key={item} />)}
            </div>
          ) : visibleRecipes.length > 0 ? (
            <div className="recipe-grid">
              {visibleRecipes.map((recipe, index) => (
                <article className="recipe-card" key={recipe.id} style={{ animationDelay: `${index * 60}ms` }} data-testid={`card-recipe-${recipe.id}`}>
                  <button className={`save-button ${favorites.includes(recipe.id) ? 'saved' : ''}`} onClick={() => toggleFavorite(recipe)} aria-label={favorites.includes(recipe.id) ? `Remover ${recipe.name} das guardadas` : `Guardar ${recipe.name}`} data-testid={`button-save-${recipe.id}`}>
                    <Heart size={17} fill={favorites.includes(recipe.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className={`recipe-image ${recipe.image} ${recipe.photo ? 'has-photo' : ''}`} style={recipe.photo ? { backgroundImage: `linear-gradient(135deg, rgba(39,51,41,.1), rgba(39,51,41,.28)), url(${recipe.photo})` } : undefined} onClick={() => openRecipe(recipe)} aria-label={`Abrir receita: ${recipe.name}`} data-testid={`button-open-${recipe.id}`} />
                  <div className="recipe-info">
                    <div className="recipe-labels">
                      <span className="recipe-category">{recipe.category}</span>
                      {recipe.isUserCreated && <span className="owner-label">{recipe.isOwner ? 'sua receita' : recipe.authorName ? `por ${recipe.authorName}` : 'comunidade'}</span>}
                    </div>
                    <h3>{recipe.name}</h3>
                    <p className="recipe-description">{recipe.description}</p>
                    <div className="recipe-meta">
                      <span><Clock3 size={13} /> {recipe.time}</span>
                      <span><UtensilsCrossed size={13} /> {recipe.servings}</span>
                      <span className="card-rating"><Star size={12} fill="currentColor" /> {getRecipeRating(recipe).average ? getRecipeRating(recipe).average.toFixed(1) : 'novo'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="empty-recipes">
              <div className="empty-plate"><Leaf size={25} /></div>
              <h3>{showFavorites ? 'Ainda não há receitas aqui' : 'Nada na despensa'}</h3>
              <p>{showFavorites ? 'Guarde suas receitas preferidas tocando no coração. Elas ficam aqui para quando bater a fome.' : 'Não encontramos uma receita com esses termos. Tente outro ingrediente ou volte a ver tudo.'}</p>
              <button className="reset-button" onClick={resetFilters} data-testid="button-reset-filters">{showFavorites ? 'Ver todas as receitas' : 'Limpar filtros'}</button>
            </div>
          )}
        </section>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="footer-brand">
              <span className="brand-mark small"><UtensilsCrossed size={15} strokeWidth={2.2} /></span>
              <span className="brand-name">a mesa</span>
            </div>
            <p>Receitas simples para o dia a dia.</p>
            <div className="footer-links">
              <a href="/termos.html">Termos de Uso</a>
              <span aria-hidden="true">•</span>
              <a href="mailto:aristidesvundo@gmail.com">aristidesvundo@gmail.com</a>
              <span aria-hidden="true">•</span>
              <span>feito com carinho</span>
              <span aria-hidden="true">•</span>
              <span>cozinha afetiva</span>
            </div>
          </div>
        </footer>
      </main>

      {selectedRecipe && (
        <div className="detail-overlay" role="dialog" aria-modal="true" aria-labelledby="recipe-title">
          <div className="detail-wrap">
            <div className="detail-topbar">
               <button className="back-button" onClick={closeRecipe} data-testid="button-back-recipe"><ArrowLeft size={17} /> Voltar para receitas</button>
               <div className="detail-actions">
                 {selectedRecipe.isOwner && (
                   <>
                     <button className="detail-edit" onClick={() => openEditor(selectedRecipe)} data-testid="button-edit-recipe">
                       <Pencil size={15} /> Editar
                     </button>
                     <button className="detail-delete" onClick={() => deleteRecipe(selectedRecipe)} data-testid="button-delete-recipe">
                       <Trash2 size={15} /> Excluir
                     </button>
                   </>
                 )}
                 <button className="detail-save" onClick={() => toggleFavorite(selectedRecipe)} data-testid="button-detail-save">
                   <Heart size={17} fill={favorites.includes(selectedRecipe.id) ? 'currentColor' : 'none'} />
                   {favorites.includes(selectedRecipe.id) ? 'Guardada' : 'Guardar'}
                 </button>
                   <button className="detail-share" onClick={() => shareRecipe(selectedRecipe)} data-testid="button-share-recipe">
                     <Share2 size={16} /> Compartilhar
                   </button>
               </div>
            </div>
             <div className={`detail-hero ${selectedRecipe.image} ${selectedRecipe.photo ? 'has-photo' : ''}`} style={selectedRecipe.photo ? { backgroundImage: `linear-gradient(135deg, rgba(39,51,41,.15), rgba(39,51,41,.42)), url(${selectedRecipe.photo})` } : undefined}>
              <div className="detail-hero-content">
                <span className="recipe-category">{selectedRecipe.category}</span>
                <h1 id="recipe-title">{selectedRecipe.name}</h1>
                <p>{selectedRecipe.description}</p>
                {(selectedRecipe.authorName || selectedRecipe.authorPhoto || selectedRecipe.authorCountry) && (
                  <div className="recipe-author" aria-label="Autor da receita">
                    {selectedRecipe.authorPhoto
                      ? <img src={selectedRecipe.authorPhoto} alt="" />
                      : <span className="recipe-author-avatar" aria-hidden="true">{selectedRecipe.authorName?.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?'}</span>}
                    <span><strong>{selectedRecipe.authorName}</strong>{selectedRecipe.authorCountry && <small>{selectedRecipe.authorCountry}</small>}</span>
                  </div>
                )}
                <div className="detail-stats">
                  <span className="detail-stat"><Clock3 size={13} /> {selectedRecipe.time}</span>
                  <span className="detail-stat"><UtensilsCrossed size={13} /> {selectedRecipe.servings}</span>
                  <span className="detail-stat"><Sparkles size={13} /> fácil</span>
                </div>
              </div>
            </div>
             <section className="rating-panel" aria-label="Avaliação da receita">
               <div>
                 <span className="rating-kicker">avaliada pela comunidade</span>
                 <div className="rating-number">{getRecipeRating(selectedRecipe).average ? getRecipeRating(selectedRecipe).average.toFixed(1) : '—'} <small>/ 5</small></div>
                 <span className="rating-count">{getRecipeRating(selectedRecipe).count ? `${getRecipeRating(selectedRecipe).count} avaliações` : 'Ainda sem avaliações'}</span>
               </div>
               <div className="rating-action">
                 <span>Sua nota</span>
                 <Stars value={userRatings[selectedRecipe.id] ?? 0} interactive onRate={(score) => rateRecipe(selectedRecipe, score)} label="Escolha uma nota de uma a cinco estrelas" />
               </div>
             </section>
            <div className="detail-content">
              <section className="detail-section">
                <h2>Na bancada</h2>
                <ul className="ingredient-list">
                  {selectedRecipe.ingredients.map(([ingredient, amount]) => <li key={ingredient}><span>{ingredient}</span><span>{amount}</span></li>)}
                </ul>
              </section>
              <section className="detail-section">
                <h2>Como fazer</h2>
                <ol className="steps-list">
                  {selectedRecipe.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </section>
              <aside className="tip-box">
                <strong>Um detalhe que faz diferença</strong>
                <p>{selectedRecipe.tip}</p>
              </aside>
              {selectedRecipe.videoUrl && (
                <section className="recipe-video-link" aria-label="Vídeo da receita">
                  <h2>Veja o vídeo</h2>
                  <a href={selectedRecipe.videoUrl} target="_blank" rel="noopener noreferrer">Assistir vídeo <Share2 size={14} /></a>
                </section>
              )}
              <section className="comments-section" aria-label="Comentários da receita">
                <div className="comments-heading">
                  <h2>Comentários</h2>
                  <span>{comments.length}</span>
                </div>
                {comments.length > 0 ? (
                  <ul className="comments-list">
                    {comments.map((comment) => (
                      <li className="comment-item" key={comment.id}>
                        <div className="comment-meta">
                          <strong>{comment.authorName}</strong>
                          <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('pt-BR')}</time>
                        </div>
                        <p>{comment.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="comments-empty">Ainda não há comentários. Comece a conversa.</p>}
                {authorProfile ? (
                  <form className="comment-form" onSubmit={submitComment}>
                    <p className="comments-empty">Comentando como <strong>{authorProfile.name}</strong></p>
                    <label>
                      <span>Comentário</span>
                      <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} required rows={3} placeholder="Conte o que achou da receita..." />
                    </label>
                    {commentError && <p className="comment-error" role="alert">{commentError}</p>}
                    <button type="submit" className="submit-recipe-button">Publicar comentário</button>
                  </form>
                ) : (
                  <div className="comment-form">
                    <p className="comments-empty">Entre na sua conta para comentar com seu nome.</p>
                    <button type="button" className="submit-recipe-button" onClick={openProfile}>Entrar</button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <div className="editor-panel">
            <div className="editor-header">
              <div>
                <span className="eyebrow">sua cozinha</span>
                <h2 id="editor-title">{editingRecipe ? 'Editar receita' : 'Nova receita'}</h2>
              </div>
              <button className="editor-close" onClick={() => setEditorOpen(false)} aria-label="Fechar formulário" data-testid="button-close-editor">
                <X size={19} />
              </button>
            </div>
            <p className="editor-copy">Compartilhe sua receita com a comunidade e volte para atualizá-la quando quiser.</p>
            <form className="recipe-form" onSubmit={saveRecipe}>
              {!authorProfile && <p className="form-error">Cadastre seu perfil em “Meu perfil” antes de publicar.</p>}
              <label className="form-field form-field-wide">
                <span>Nome da receita</span>
                <input value={recipeForm.name} onChange={(event) => updateRecipeForm('name', event.target.value)} placeholder="Ex.: Macarrão de domingo" autoFocus data-testid="input-recipe-name" />
              </label>
              <div className="editor-grid">
                <label className="form-field">
                  <span>Categoria</span>
                  <select value={recipeForm.category} onChange={(event) => updateRecipeForm('category', event.target.value as RecipeFormState['category'])} data-testid="select-recipe-category">
                    {recipeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Tempo</span>
                  <input value={recipeForm.time} onChange={(event) => updateRecipeForm('time', event.target.value)} placeholder="Ex.: 40 min" data-testid="input-recipe-time" />
                </label>
                <label className="form-field">
                  <span>Porções</span>
                  <input value={recipeForm.servings} onChange={(event) => updateRecipeForm('servings', event.target.value)} placeholder="Ex.: 4 porcoes" data-testid="input-recipe-servings" />
                </label>
              </div>
              <label className="form-field">
                <span>Descrição <small>opcional</small></span>
                <input value={recipeForm.description} onChange={(event) => updateRecipeForm('description', event.target.value)} placeholder="O que torna essa receita especial?" data-testid="input-recipe-description" />
              </label>
              <label className="form-field">
                <span>Link do vídeo <small>opcional, qualquer plataforma</small></span>
                <input type="url" value={recipeForm.videoUrl} onChange={(event) => updateRecipeForm('videoUrl', event.target.value)} placeholder="https://..." data-testid="input-recipe-video-url" />
              </label>
              <label className="form-field">
                <span>Ingredientes</span>
                <textarea value={recipeForm.ingredients} onChange={(event) => updateRecipeForm('ingredients', event.target.value)} placeholder={'Um por linha, usando | para separar a quantidade\nEx.: Tomate | 2 unidades'} rows={5} data-testid="textarea-recipe-ingredients" />
                <small>Uma linha por ingrediente. A quantidade depois do | é opcional.</small>
              </label>
              <label className="form-field">
                <span>Modo de preparo</span>
                <textarea value={recipeForm.steps} onChange={(event) => updateRecipeForm('steps', event.target.value)} placeholder={'Um passo por linha\nEx.: Refogue o alho no azeite.'} rows={5} data-testid="textarea-recipe-steps" />
                <small>Separe o preparo em passos, um por linha.</small>
              </label>
              <label className="form-field">
                <span>Seu detalhe especial <small>opcional</small></span>
                <textarea value={recipeForm.tip} onChange={(event) => updateRecipeForm('tip', event.target.value)} placeholder="Um truque ou lembrança para não esquecer..." rows={3} data-testid="textarea-recipe-tip" />
              </label>
              <div className="form-field">
                <span>Foto da receita <small>opcional</small></span>
                <div className="photo-picker">
                  {recipeForm.photo ? <img src={recipeForm.photo} alt="Prévia da receita" className="photo-preview" /> : <div className="photo-placeholder"><ImagePlus size={22} /><span>Escolha uma foto da sua galeria</span></div>}
                  <label className="photo-upload-button">
                    <ImagePlus size={15} /> {recipeForm.photo ? 'Trocar foto' : 'Adicionar foto'}
                    <input type="file" accept="image/*" onChange={(event) => handlePhotoChange(event.target.files?.[0])} />
                  </label>
                  {recipeForm.photo && <button type="button" className="photo-remove-button" onClick={() => updateRecipeForm('photo', '')}>Remover foto</button>}
                </div>
                <small>A foto é salva junto com a receita no banco de dados.</small>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="editor-footer">
                <button type="button" className="cancel-button" onClick={() => setEditorOpen(false)}>Cancelar</button>
                <button type="submit" className="submit-recipe-button"><Check size={15} /> Salvar receita</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div className="editor-panel profile-panel">
            <div className="editor-header">
              <div>
                <span className="eyebrow">sua conta</span>
                <h2 id="profile-title">{authorProfile && !isPasswordRecovery ? 'Meu perfil' : authMode === 'register' ? 'Criar conta' : authMode === 'forgot' ? 'Recuperar senha' : 'Entrar'}</h2>
              </div>
              <button className="editor-close" onClick={() => setProfileOpen(false)} aria-label="Fechar perfil" data-testid="button-close-profile"><X size={19} /></button>
            </div>
            <p className="editor-copy">{authorProfile && !isPasswordRecovery
              ? 'Seus dados ficam separados das receitas; somente nome, foto e país aparecem publicamente.'
              : authMode === 'register' ? 'Crie uma conta para publicar e editar suas receitas.'
                : authMode === 'forgot' ? 'Informe seu email, a comida favorita e escolha uma nova senha.'
                  : 'Entre para publicar receitas e acessar seu perfil.'}</p>
            <form className="profile-form" onSubmit={authorProfile && !isPasswordRecovery ? saveAuthorProfile : authMode === 'forgot' ? recoverAccount : authenticate}>
              {(!authorProfile && authMode === 'register') || (authorProfile && !isPasswordRecovery) ? (
              <div className="profile-photo-editor">
                {profileForm.photo
                  ? <img src={profileForm.photo} alt="Prévia da foto de perfil" />
                  : <span className="author-photo-placeholder">Sem foto</span>}
                <div>
                  <label className="photo-upload-button">
                    <ImagePlus size={15} /> {profileForm.photo ? 'Trocar foto' : 'Adicionar foto'}
                    <input type="file" accept="image/*" onChange={(event) => handleAuthorPhotoChange(event.target.files?.[0])} />
                  </label>
                  {profileForm.photo && <button type="button" className="photo-remove-button" onClick={() => setProfileForm((current) => ({ ...current, photo: '' }))}>Remover foto</button>}
                </div>
              </div>
              ) : null}
              {(!authorProfile && authMode === 'register') || (authorProfile && !isPasswordRecovery) ? (
              <label className="form-field">
                <span>Nome</span>
                <input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} maxLength={100} required autoComplete="name" placeholder="Seu nome" data-testid="input-profile-name" />
              </label>
              ) : null}
              <label className="form-field">
                <span>Email <small>privado</small></span>
                <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} required autoComplete="email" placeholder="voce@exemplo.com" readOnly={Boolean(authorProfile)} data-testid="input-profile-email" />
              </label>
              {((!authorProfile && authMode === 'register') || authMode === 'forgot' || (authorProfile && !isPasswordRecovery)) && <label className="form-field">
                <span>Qual é sua comida favorita? <small>resposta privada</small></span>
                <input type="text" value={favoriteFood} onChange={(event) => setFavoriteFood(event.target.value)} maxLength={120} required={!authorProfile || !authorProfile.hasRecoveryAnswer} autoComplete="off" placeholder={authMode === 'forgot' ? 'Informe a resposta do cadastro' : authorProfile?.hasRecoveryAnswer ? 'Preencha para substituir a resposta' : 'Sua resposta de recuperação'} data-testid="input-recovery-food" />
                <small>{authMode === 'forgot' ? 'A resposta ignora maiúsculas e acentos.' : 'Guarde essa resposta; ela será necessária para recuperar sua conta.'}</small>
              </label>}
              {!authorProfile && (authMode === 'login' || authMode === 'register') && <label className="form-field">
                <span>Senha</span>
                <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={8} maxLength={200} required autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} placeholder={authMode === 'register' ? 'Pelo menos 8 caracteres' : 'Sua senha'} data-testid="input-auth-password" />
                {authMode === 'register' && <small>A senha deve ter no mínimo 8 caracteres.</small>}
              </label>}
              {!authorProfile && authMode === 'login' && <button type="button" className="forgot-password-button" onClick={() => { setAuthMode('forgot'); setProfileError(''); }}>Esqueci a senha</button>}
              {authMode === 'forgot' && <>
                <label className="form-field">
                  <span>Nova senha</span>
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={200} required autoComplete="new-password" placeholder="Pelo menos 8 caracteres" data-testid="input-new-password" />
                </label>
                <label className="form-field">
                  <span>Confirmar nova senha</span>
                  <input type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} minLength={8} maxLength={200} required autoComplete="new-password" placeholder="Repita a nova senha" data-testid="input-confirm-new-password" />
                </label>
              </>}
              {((!authorProfile && authMode === 'register') || (authorProfile && !isPasswordRecovery)) && <>
              <div className="author-profile-grid">
                <label className="form-field">
                  <span>País <small>visível</small></span>
                  <input value={profileForm.country} onChange={(event) => setProfileForm((current) => ({ ...current, country: event.target.value }))} maxLength={80} autoComplete="country-name" placeholder="Ex.: Moçambique" data-testid="input-profile-country" />
                </label>
                <label className="form-field">
                  <span>Morada <small>privada</small></span>
                  <input value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} maxLength={250} autoComplete="address-level2" placeholder="Cidade ou região" data-testid="input-profile-address" />
                </label>
              </div>
              </>}
              {profileError && <p className="form-error" role="alert">{profileError}</p>}
              <div className="editor-footer">
                {authorProfile && !isPasswordRecovery ? <>
                  <button type="button" className="cancel-button" onClick={logout}>Sair da conta</button>
                  <button type="submit" className="submit-recipe-button"><Check size={15} /> Guardar perfil</button>
                </> : <>
                  <button type="button" className="cancel-button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setProfileError(''); }}>{authMode === 'login' ? 'Criar conta' : 'Entrar'}</button>
                  <button type="submit" className="submit-recipe-button"><Check size={15} /> {authMode === 'register' ? 'Criar conta' : authMode === 'forgot' ? 'Alterar senha' : 'Entrar'}</button>
                </>}
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><Check size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} />{toast}</div>}
    </div>
  );
}

export default App;