import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  BedDouble,
  BusFront,
  CalendarDays,
  CarFront,
  Clock3,
  Compass,
  Languages,
  Heart,
  Hotel,
  MapPin,
  MessageCircle,
  Plane,
  Phone,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrainFront,
  Users,
} from 'lucide-react';
import { attractions, destinations, categories, hotels, transportOptions } from './data';
import { guides } from './guides';
import './styles.css';

const chatPrompts = [
  'Recommend a beach destination',
  'Plan a 3-day trip to Jaipur',
  'Tell me about Kerala',
];

function readGuideRatings() {
  try {
    const saved = JSON.parse(localStorage.getItem('travelora-guide-ratings') || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(
      Object.entries(saved).filter(([, rating]) => Number.isInteger(rating) && rating >= 1 && rating <= 5),
    );
  } catch (error) {
    console.error('Unable to read guide ratings.', error);
    return {};
  }
}

const starterReviews = [
  { id: 'sample-1', name: 'Ananya', city: 'Goa', rating: 5, text: 'Goa was magical — pristine beaches, amazing seafood and the sunsets at Palolem were unforgettable!', date: '16/9/2026' },
  { id: 'sample-2', name: 'Rohit', city: 'Goa', rating: 4, text: 'Great vibe but can get crowded in peak season. Dudhsagar Falls is a must-visit.', date: '16/9/2026' },
  { id: 'sample-3', name: 'Meera', city: 'Kerala', rating: 5, text: "The houseboat stay in Alleppey was the most peaceful experience of my life. God's Own Country indeed!", date: '16/9/2026' },
];

function readReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem('travelora-reviews') || 'null');
    return Array.isArray(saved) ? saved.filter((review) => (
      review && typeof review.id === 'string' && typeof review.name === 'string'
      && typeof review.city === 'string' && typeof review.text === 'string'
      && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    )) : starterReviews;
  } catch (error) {
    console.error('Unable to read travel reviews.', error);
    return starterReviews;
  }
}

function getCityRating(city, reviews) {
  const cityReviews = reviews.filter((review) => review.city === city);
  if (!cityReviews.length) return null;
  return (cityReviews.reduce((total, review) => total + review.rating, 0) / cityReviews.length).toFixed(1);
}

const destinationAliases = {
  1: ['taj mahal', 'agra fort', 'fatehpur sikri'],
  2: ['god’s own country', 'backwater', 'alleppey', 'munnar', 'thekkady'],
  3: ['lake city', 'lake pichola', 'city palace'],
  4: ['pink city', 'amber fort', 'hawa mahal'],
  5: ['himachal', 'himachal pradesh', 'rohtang', 'solang valley'],
  6: ['panaji', 'baga', 'palolem', 'beaches'],
  7: ['mysuru', 'mysore palace', 'chamundi hill'],
  8: ['charminar', 'golconda', 'telangana'],
  9: ['marine drive', 'bollywood', 'maharashtra'],
  10: ['new delhi', 'red fort', 'india gate', 'qutub minar'],
};

function findDestination(question) {
  const query = question.toLowerCase();
  return destinations.find((destination) => {
    const searchable = [
      destination.name,
      destination.location,
      ...(destinationAliases[destination.id] || []),
    ];
    return searchable.some((term) => query.includes(term.toLowerCase()));
  });
}

function getCategory(question) {
  const query = question.toLowerCase();
  const matches = [
    { category: 'Beach', words: ['beach', 'sea', 'coast', 'island', 'swim'] },
    { category: 'Hill Station', words: ['mountain', 'hill', 'hills', 'snow', 'himalaya'] },
    { category: 'Heritage', words: ['heritage', 'history', 'historic', 'palace', 'fort', 'culture'] },
    { category: 'Backwater', words: ['nature', 'backwater', 'wildlife', 'relax'] },
    { category: 'Heritage', words: ['lake'] },
    { category: 'Hill Station', words: ['adventure', 'trek', 'trekking', 'active'] },
    { category: 'Heritage', words: ['romantic', 'couple', 'honeymoon'] },
    { category: 'Heritage', words: ['spiritual', 'temple', 'pilgrimage'] },
  ];
  return matches.find(({ words }) => words.some((word) => query.includes(word)))?.category;
}

function makeItinerary(destination, requestedDays) {
  const days = Math.min(Math.max(requestedDays || 3, 1), 7);
  const activities = {
    Beach: ['Settle in and enjoy a relaxed afternoon by the coast.', 'Explore the shoreline and local cafés.', 'Keep the day flexible for a swim, a boat trip or a sunset.'],
    'Hill Station': ['Arrive, take it easy and enjoy the mountain scenery.', 'Explore the town and nearby viewpoints.', 'Choose a gentle outdoor activity and leave time to unwind.'],
    Heritage: ['Start with the main historic sights and local orientation.', 'Explore the architecture, museums or nearby landmarks.', 'Visit a local market and revisit a favorite spot.'],
    Backwater: ['Arrive and get acquainted with the local landscape.', 'Spend the day exploring the waterways or natural surroundings.', 'Enjoy a slower morning and a scenic afternoon.'],
    Metro: ['Arrive and get your bearings in the city.', 'Explore a few local landmarks and sample the local food.', 'Leave time for a neighborhood stroll and a relaxed final meal.'],
  };
  const ideas = activities[destination.category] || activities.Backwater;
  const itinerary = Array.from({ length: days }, (_, index) => `Day ${index + 1}: ${ideas[index % ideas.length]}`);
  const durationNote = requestedDays > 7 ? ' I’ve kept this first outline to seven days; ask me to continue with the next part.' : '';
  return `Here’s a ${requestedDays || 3}-day starting itinerary for ${destination.name}, ${destination.location}:\n${itinerary.join('\n')}\n\nThese are flexible trip ideas, not live bookings or verified opening hours.${durationNote}`;
}

function getAssistantReply(question) {
  const query = question.toLowerCase();
  const destination = findDestination(question);
  const daysMatch = query.match(/\b(\d+)\s*[- ]?\s*days?\b/);
  const requestedDays = daysMatch ? Number(daysMatch[1]) : 3;
  const asksForPlan = /\b(plan|itinerary|schedule|day.by.day)\b/.test(query);

  if (asksForPlan && destination) {
    return makeItinerary(destination, requestedDays);
  }

  if (destination) {
    return `${destination.name} is in ${destination.location} and is listed as a ${destination.category.toLowerCase()} destination, rated ${destination.rating}/5. ${destination.description} Would you like a ${requestedDays}-day itinerary?`;
  }

  const category = getCategory(question);
  if (category) {
    const recommendations = destinations.filter((place) => place.category === category);
    if (recommendations.length) {
      const suggestions = recommendations
        .slice(0, 3)
        .map((place) => `${place.name} (${place.location})`)
        .join(', ');
      return `For a ${category.toLowerCase()} getaway, take a look at ${suggestions}. Which one would you like to know more about?`;
    }
  }

  if (asksForPlan) {
    return 'I can put together a simple day-by-day outline. Which destination are you visiting, and how many days do you have?';
  }
  if (/\b(weather|forecast|temperature)\b/.test(query)) {
    return 'I don’t have live weather data. Check a current local forecast for your travel dates; if you tell me the season and places you’re considering, I can help compare trip styles.';
  }
  if (/\b(hotel|stay|accommodation|flight|train|transport|bus|route|booking|book)\b/.test(query)) {
    return 'The destination list doesn’t include live hotel, transport or booking information. Tell me your starting point and destination, and I can help you think through a general trip plan.';
  }
  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(query)) {
    return 'Hello! I can recommend a place from the Travelora destination list, share destination details or sketch a trip itinerary. What kind of trip are you planning?';
  }
  if (/\b(help|what can you do|suggest|recommend)\b/.test(query)) {
    return `I can help you choose from ${destinations.length} destinations, compare their categories and ratings, and sketch a day-by-day itinerary. Try “recommend a beach destination” or “plan a 3-day trip to Jaipur.”`;
  }
  return 'I can help with destination details, travel styles and simple itineraries using the Travelora destination list. Try “Tell me about Manali,” “recommend a heritage trip,” or “plan a 3-day trip to Goa.”';
}

function Header() {
  const location = useLocation();
  const links = [
    ['/explore', 'Destinations'],
    ['/attractions', 'Attractions'],
    ['/hotels', 'Hotels'],
    ['/transport', 'Transport'],
    ['/guides', 'Guides'],
    ['/reviews', 'Reviews'],
    ['/about', 'About'],
  ];
  return (
    <header className="nav">
      <div className="container navin">
        <Link className="brand" to="/" aria-label="Travelora home">
          <span className="brandmark"><Compass size={22} /></span>
          <span><b className="logo">Travelora</b><small>EXPLORE · PLAN · EXPERIENCE</small></span>
        </Link>
        <nav className="navlinks" aria-label="Main navigation">
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">Home</Link>
          {links.map(([path, label]) => <Link className={location.pathname === path ? 'active' : ''} key={label} to={path}>{label}</Link>)}
        </nav>
        <div className="account-links">
          <Link to="/login">Login</Link>
          <Link className="navbtn" to="/register">Register</Link>
        </div>
      </div>
      <div className="mobile-nav">
        <Link to="/">Home</Link>
        <Link to="/explore">Destinations</Link>
        <Link to="/attractions">Attractions</Link>
        <Link to="/hotels">Hotels</Link>
        <Link to="/transport">Transport</Link>
        <Link to="/guides">Guides</Link>
        <Link to="/reviews">Reviews</Link>
        <Link to="/about">About</Link>
        <Link to="/planner">Trip planner</Link>
        <Link to="/login">Login</Link>
      </div>
    </header>
  );
}

function Card({ destination }) {
  return (
    <article className="card">
      <img className="cardimg" src={destination.image} alt={destination.name} />
      <div className="cardbody">
        <span className="pill">{destination.category}</span>
        <h3>{destination.name}</h3>
        <div className="muted location"><MapPin size={14} /> {destination.location}</div>
        <p className="muted">{destination.description}</p>
        <div className="card-actions">
          <span className="entry-fee">Entry ₹{destination.entryFee}</span>
          <Link className="details" to={`/destination/${destination.id}`}>Explore <ArrowRight size={15} /></Link>
        </div>
      </div>
    </article>
  );
}

function Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I’m your Travelora trip assistant. Ask me about a destination, a travel style, or a simple itinerary.' },
  ]);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  function sendMessage(text = input) {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      { role: 'bot', text: getAssistantReply(question) },
    ]);
    setInput('');
  }

  return (
    <div className="chat">
      {open && (
        <section className="chatpanel" aria-label="Travelora trip assistant">
          <div className="chathead">
            <span className="chat-avatar"><Sparkles size={18} /></span>
            <div><b>Travelora AI</b><div className="chat-status">Ready to help · Destination-aware</div></div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`msg ${message.role}`}>{message.text}</div>
            ))}
            {messages.length === 1 && (
              <div className="prompt-list">
                {chatPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>
                ))}
              </div>
            )}
          </div>
          <form className="chatinput" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your trip..."
              aria-label="Message the Travelora assistant"
            />
            <button type="submit" disabled={!input.trim()} aria-label="Send message"><Send size={17} /></button>
          </form>
          <div className="chat-disclaimer">Replies use Travelora’s destination list; live travel data isn’t available.</div>
        </section>
      )}
      <button
        className="chatbubble"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close Travelora AI assistant' : 'Open Travelora AI assistant'}
        aria-expanded={open}
      >
        {open ? <span>×</span> : <MessageCircle />}
      </button>
    </div>
  );
}

function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  function explore() {
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  }
  return (
    <>
      <div className="home-search">
        <div className="container searchbox">
          <Search size={20} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && explore()}
            placeholder="Search destinations, hotels, attractions..."
            aria-label="Search destinations, hotels and attractions"
          />
          <button onClick={explore}>Explore</button>
        </div>
      </div>
      <section className="hero">
        <div className="container hero-content">
          <span className="eyebrow">TOURISM INFORMATION RETRIEVAL SYSTEM</span>
          <h1>Discover<br />Beautiful <span>India</span></h1>
          <p>Explore destinations, discover attractions, find hotels and plan your journey with Travelora.</p>
          <div className="hero-actions">
            <Link className="hero-button hero-button-light" to="/explore">Browse Destinations <ArrowRight size={17} /></Link>
            <Link className="hero-button hero-button-gold" to="/attractions"><Sparkles size={17} /> Explore Attractions</Link>
          </div>
        </div>
        <a className="hero-scroll" href="#discover">Scroll to discover <span>↓</span></a>
      </section>

      <section className="quick-links" id="discover">
        <div className="container quick-grid">
          <Link className="quick-card" to="/explore">
            <span className="quick-icon"><MapPin /></span><span><b>Destinations</b><small>Discover 10+ iconic Indian destinations</small></span><ArrowRight className="quick-arrow" size={18} />
          </Link>
          <Link className="quick-card" to="/attractions">
            <span className="quick-icon"><Compass /></span><span><b>Attractions</b><small>Explore historical &amp; natural wonders</small></span><ArrowRight className="quick-arrow" size={18} />
          </Link>
          <Link className="quick-card" to="/hotels">
            <span className="quick-icon"><Hotel /></span><span><b>Hotels</b><small>Find &amp; book premium stays</small></span><ArrowRight className="quick-arrow" size={18} />
          </Link>
          <Link className="quick-card" to="/transport">
            <span className="quick-icon"><TrainFront /></span><span><b>Transportation</b><small>Trains, flights, buses &amp; more</small></span><ArrowRight className="quick-arrow" size={18} />
          </Link>
        </div>
      </section>

      <section className="section destinations-section" id="attractions">
        <div className="container">
          <div className="sectionhead">
            <div><span className="eyebrow">MOST LOVED</span><h2>Popular Destinations</h2><p className="muted">Handpicked Indian destinations loved by travellers across the country.</p></div>
            <Link className="details view-all" to="/explore">View all <ArrowRight size={16} /></Link>
          </div>
          <div className="grid">{destinations.map((destination) => <Card destination={destination} key={destination.id} />)}</div>
          <div className="destinations-cta"><Link className="primary" to="/explore">Start Exploring <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section className="section assistant-section" id="guides">
        <div className="container assistant-card">
          <div className="assistant-copy">
            <span className="eyebrow">YOUR TRAVEL COMPANION</span>
            <h2>Meet Travelora AI</h2>
            <p>Get ideas from our destination list, compare travel styles, and sketch a day-by-day trip plan. Start with a question and make the journey your own.</p>
            <button className="hero-button hero-button-light" onClick={() => document.querySelector('.chatbubble')?.click()}>Chat with Travelora AI <MessageCircle size={17} /></button>
          </div>
          <div className="assistant-suggestions" id="reviews">
            {chatPrompts.map((prompt, index) => <div className="suggestion" key={prompt}><span>0{index + 1}</span>{prompt}<ArrowRight size={16} /></div>)}
            <p>Destination ratings and recommendations are based on the places in this demo.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function Explore() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const list = destinations.filter((destination) =>
    (category === 'All' || destination.category === category)
    && (!query || `${destination.name} ${destination.location} ${destination.category}`.toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <>
      <div className="pagehead"><div className="container"><span className="eyebrow">DISCOVER INDIA</span><h1>Explore destinations</h1><p className="muted">Search our destination list by place, location or travel style.</p></div></div>
      <section className="section"><div className="container">
        <div className="toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destinations..." aria-label="Search destinations" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by travel style">{categories.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="grid">{list.map((destination) => <Card destination={destination} key={destination.id} />)}</div>
        {!list.length && <div className="empty">No destinations found. Try another search or travel style.</div>}
      </div></section>
    </>
  );
}

const attractionTypes = ['All', 'Historical', 'Beach', 'Temple', 'Museum', 'Wildlife', 'Adventure', 'Nature', 'Heritage'];
const transportModes = ['All', 'Train', 'Bus', 'Flight', 'Taxi', 'Rental Car'];

function Attractions() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [city, setCity] = useState('All places');
  const cities = [...new Set(attractions.map((attraction) => attraction.city))].sort();
  const filtered = attractions.filter((attraction) => {
    const searchable = `${attraction.name} ${attraction.city} ${attraction.type} ${attraction.description}`.toLowerCase();
    return (type === 'All' || attraction.type === type)
      && (city === 'All places' || attraction.city === city)
      && searchable.includes(query.trim().toLowerCase());
  });
  return (
    <>
      <section className="catalog-hero"><div className="container"><span className="eyebrow">EXPLORE INDIA</span><h1>Attractions</h1><p>Find memorable places, from historic landmarks and temples to beaches, wildlife and outdoor adventures.</p></div></section>
      <section className="catalog-section"><div className="container">
        <div className="catalog-toolbar">
          <label className="catalog-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search attractions..." aria-label="Search attractions" /></label>
          <label className="catalog-select"><SlidersHorizontal size={17} /><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter attractions by destination"><option>All places</option>{cities.map((place) => <option key={place}>{place}</option>)}</select></label>
        </div>
        <div className="chip-row" aria-label="Attraction types">{attractionTypes.map((item) => <button key={item} className={`filter-chip${type === item ? ' selected' : ''}`} onClick={() => setType(item)} aria-pressed={type === item}>{item}</button>)}</div>
        <p className="catalog-count">{filtered.length} attractions found</p>
        {filtered.length ? <div className="catalog-grid">{filtered.map((attraction) => (
          <article className="catalog-card" key={attraction.id}>
            <div className="catalog-image-wrap"><img src={attraction.image} alt={attraction.name} loading="lazy" /><span className="image-tag">{attraction.type}</span></div>
            <div className="catalog-card-body"><h2>{attraction.name}</h2><span className="catalog-city">{attraction.city}</span><p>{attraction.description}</p><Link className="details" to={`/explore?q=${encodeURIComponent(attraction.city)}`}>Explore {attraction.city} <ArrowRight size={15} /></Link></div>
          </article>
        ))}</div> : <div className="empty">No attractions match those filters. Try another search or type.</div>}
      </div></section>
    </>
  );
}

function Hotels() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All destinations');
  const [maxPrice, setMaxPrice] = useState('');
  const [minimumRating, setMinimumRating] = useState('');
  const [reviews] = useState(readReviews);
  const cities = [...new Set(hotels.map((hotel) => hotel.city))].sort();
  const filtered = hotels.filter((hotel) => (
    `${hotel.name} ${hotel.city}`.toLowerCase().includes(query.trim().toLowerCase())
    && (city === 'All destinations' || hotel.city === city)
    && (!maxPrice || hotel.price <= Number(maxPrice))
    && (!minimumRating || Number(getCityRating(hotel.city, reviews) || hotel.rating) >= Number(minimumRating))
  ));
  const navigate = useNavigate();
  return (
    <>
      <section className="catalog-hero hotel-hero"><div className="container"><span className="eyebrow">WHERE TO STAY</span><h1>Hotels</h1><p>Find and book premium hotels across India — filter by destination, price and rating.</p></div></section>
      <section className="catalog-section"><div className="container">
        <div className="catalog-toolbar hotel-toolbar">
          <label className="catalog-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hotels..." aria-label="Search hotels" /></label>
          <label className="catalog-select"><MapPin size={17} /><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter hotels by destination"><option>All destinations</option>{cities.map((place) => <option key={place}>{place}</option>)}</select></label>
          <label className="price-filter">Max price <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any" aria-label="Maximum price per night in rupees" /></label>
          <label className="catalog-select rating-filter"><Star size={16} /><select value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)} aria-label="Filter hotels by minimum rating"><option value="">Any rating</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select></label>
        </div>
        <p className="catalog-count">{filtered.length} hotels found</p>
        {filtered.length ? <div className="hotel-grid">{filtered.map((hotel) => {
          const reviewRating = getCityRating(hotel.city, reviews);
          return <article className="hotel-card" key={hotel.id}>
            <div className="hotel-image-wrap"><img src={hotel.image} alt={`Hotel-style photo for ${hotel.name} in ${hotel.city}`} loading="lazy" /><span>Stay inspiration</span></div>
            <div className="hotel-card-body"><div className="hotel-card-heading"><div><h2>{hotel.name}</h2><span className="catalog-city"><MapPin size={14} /> {hotel.city}</span></div><span className="rating"><Star size={15} fill="currentColor" /> {reviewRating || hotel.rating.toFixed(1)}</span></div>
              <p>{hotel.description}</p><div className="hotel-card-footer"><span className="hotel-price">₹{hotel.price.toLocaleString('en-IN')} <small>/ night</small></span><div className="hotel-actions">
                <Link className="secondary hotel-review-link" to={`/reviews?city=${encodeURIComponent(hotel.city)}`}>Reviews</Link>
                <button className="primary" onClick={() => navigate(`/booking/${hotel.id}`)}>Plan stay</button>
              </div></div>
            </div>
          </article>;
        })}</div> : <div className="empty">No hotels match your search. Try changing the destination or price.</div>}
      </div></section>
    </>
  );
}

function toDateInputValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function Booking() {
  const navigate = useNavigate();
  const hotelId = Number(useLocation().pathname.split('/').pop());
  const hotel = hotels.find((item) => item.id === hotelId);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextDay = new Date(tomorrow);
  nextDay.setDate(tomorrow.getDate() + 1);
  const [checkIn, setCheckIn] = useState(toDateInputValue(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateInputValue(nextDay));
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState('');

  if (!hotel) return <NotFound />;

  const nights = Math.max(1, Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86_400_000));
  const total = hotel.price * nights * Number(rooms);
  const minimumDate = toDateInputValue(today);

  function updateCheckIn(value) {
    setCheckIn(value);
    if (value >= checkOut) {
      const followingDay = new Date(`${value}T12:00:00`);
      followingDay.setDate(followingDay.getDate() + 1);
      setCheckOut(toDateInputValue(followingDay));
    }
  }

  function submitBooking(event) {
    event.preventDefault();
    setConfirmation(`TRV-${Date.now().toString().slice(-8)}`);
  }

  if (confirmation) {
    return (
      <section className="booking-page"><div className="container"><div className="booking-confirmation">
        <span className="confirmation-check" aria-hidden="true">✓</span>
        <span className="eyebrow">THANK YOU</span>
        <h1>Your stay request is ready, {guestName.split(' ')[0]}!</h1>
        <p className="confirmation-lead">We’ve prepared your booking summary for <strong>{hotel.name}</strong> in {hotel.city}.</p>
        <div className="confirmation-details">
          <span>Request reference <strong>{confirmation}</strong></span>
          <span>Check-in <strong>{checkIn}</strong></span>
          <span>Check-out <strong>{checkOut}</strong></span>
          <span>Guests and rooms <strong>{guests} guests · {rooms} {Number(rooms) === 1 ? 'room' : 'rooms'}</strong></span>
          <span>Estimated total <strong>₹{total.toLocaleString('en-IN')}</strong></span>
        </div>
        <p className="booking-disclaimer">This is a demo booking request only. No room has been reserved, no hotel has been contacted, and no payment was taken.</p>
        <div className="booking-confirmation-actions"><Link className="primary" to="/hotels">Back to hotels</Link><Link className="secondary" to={`/reviews?city=${encodeURIComponent(hotel.city)}`}>Read {hotel.city} reviews</Link></div>
      </div></div></section>
    );
  }

  return (
    <section className="booking-page"><div className="container">
      <Link className="booking-back" to="/hotels">← Back to hotels</Link>
      <div className="booking-heading"><span className="eyebrow">YOUR STAY</span><h1>Book your stay</h1><p>Choose your dates and guest details to prepare a booking request.</p></div>
      <div className="booking-layout">
        <form className="booking-form" onSubmit={submitBooking}>
          <h2>Guest details</h2>
          <div className="booking-field"><label htmlFor="booking-name">Full name</label><input id="booking-name" autoComplete="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Name on the reservation" required maxLength="100" /></div>
          <div className="booking-contact-fields">
            <div className="booking-field"><label htmlFor="booking-email">Email address</label><input id="booking-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
            <div className="booking-field"><label htmlFor="booking-phone">Phone number</label><input id="booking-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" required /></div>
          </div>
          <h2 className="booking-section-title">Your trip</h2>
          <div className="booking-date-fields">
            <div className="booking-field"><label htmlFor="booking-checkin"><CalendarDays size={15} /> Check-in</label><input id="booking-checkin" type="date" min={minimumDate} value={checkIn} onChange={(event) => updateCheckIn(event.target.value)} required /></div>
            <div className="booking-field"><label htmlFor="booking-checkout"><CalendarDays size={15} /> Check-out</label><input id="booking-checkout" type="date" min={checkIn || minimumDate} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required /></div>
          </div>
          <div className="booking-date-fields">
            <div className="booking-field"><label htmlFor="booking-guests"><Users size={15} /> Guests</label><select id="booking-guests" value={guests} onChange={(event) => setGuests(event.target.value)}>{[1, 2, 3, 4, 5, 6, 7, 8].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'guest' : 'guests'}</option>)}</select></div>
            <div className="booking-field"><label htmlFor="booking-rooms"><BedDouble size={15} /> Rooms</label><select id="booking-rooms" value={rooms} onChange={(event) => setRooms(event.target.value)}>{[1, 2, 3, 4].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'room' : 'rooms'}</option>)}</select></div>
          </div>
          <p className="booking-demo-note">Demo only — this form does not contact the hotel or collect payment.</p>
          <button className="primary booking-submit" type="submit">Continue to booking summary</button>
        </form>
        <aside className="booking-summary">
          <img src={hotel.image} alt={`Hotel-style photo for ${hotel.name}`} />
          <div className="booking-summary-body">
            <span className="eyebrow">YOUR HOTEL</span><h2>{hotel.name}</h2><p className="catalog-city"><MapPin size={15} /> {hotel.city}</p><p>{hotel.description}</p>
            <div className="booking-price-row"><span>₹{hotel.price.toLocaleString('en-IN')} × {nights} {nights === 1 ? 'night' : 'nights'} × {rooms} {Number(rooms) === 1 ? 'room' : 'rooms'}</span><strong>₹{total.toLocaleString('en-IN')}</strong></div>
            <small>Estimated total · sample price</small>
            <Link className="booking-reviews" to={`/reviews?city=${encodeURIComponent(hotel.city)}`}>Read reviews for {hotel.city} <ArrowRight size={14} /></Link>
          </div>
        </aside>
      </div>
    </div></section>
  );
}

function Transport() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('All');
  const filtered = transportOptions.filter((option) => (
    (mode === 'All' || option.mode === mode)
    && `${option.operator} ${option.from} ${option.to} ${option.mode}`.toLowerCase().includes(query.trim().toLowerCase())
  ));
  const navigate = useNavigate();
  function iconFor(optionMode) {
    if (optionMode === 'Flight') return <Plane size={22} />;
    if (optionMode === 'Train') return <TrainFront size={22} />;
    if (optionMode === 'Bus') return <BusFront size={22} />;
    return <CarFront size={22} />;
  }
  return (
    <>
      <section className="catalog-hero transport-hero"><div className="container"><span className="eyebrow">GETTING AROUND</span><h1>Transport</h1><p>Compare sample trains, buses, flights and local rides for popular routes across India.</p></div></section>
      <section className="catalog-section"><div className="container">
        <div className="catalog-toolbar"><label className="catalog-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transport..." aria-label="Search transport options" /></label></div>
        <div className="chip-row">{transportModes.map((item) => <button key={item} className={`filter-chip${mode === item ? ' selected' : ''}`} onClick={() => setMode(item)} aria-pressed={mode === item}>{item}</button>)}</div>
        <p className="catalog-count">{filtered.length} options found</p>
        {filtered.length ? <div className="transport-grid">{filtered.map((option) => (
          <article className="transport-card" key={option.id}>
            <div className="transport-icon">{iconFor(option.mode)}</div>
            <div className="transport-details"><div className="transport-title"><h2>{option.operator}</h2><span className={`availability ${option.availability.toLowerCase()}`}>{option.availability}</span></div>
              <p className="transport-route"><MapPin size={15} /> {option.from} <span>→</span> {option.to}</p>
              <div className="transport-meta"><span>{option.mode}</span><span><Clock3 size={14} /> {option.departure}</span><span>{option.duration}</span></div>
            </div>
            <div className="transport-fare"><strong>₹{option.fare.toLocaleString('en-IN')}</strong><small>fare</small><button onClick={() => navigate(`/planner?destination=${encodeURIComponent(option.to)}&route=${encodeURIComponent(`${option.from} to ${option.to} by ${option.mode}`)}`)}>Add to trip</button></div>
          </article>
        ))}</div> : <div className="empty">No transport options found for that search.</div>}
        <p className="catalog-disclaimer">Sample fares and availability are for demonstration only; live schedules and bookings are not connected.</p>
      </div></section>
    </>
  );
}

function Reviews() {
  const location = useLocation();
  const [reviews, setReviews] = useState(readReviews);
  const [city, setCity] = useState(new URLSearchParams(location.search).get('city') || 'All destinations');
  const [name, setName] = useState('');
  const [selectedCity, setSelectedCity] = useState(new URLSearchParams(location.search).get('city') || '');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const reviewCities = [...new Set([...destinations.map((place) => place.name), ...reviews.map((review) => review.city)])].sort();
  const filtered = reviews.filter((review) => city === 'All destinations' || review.city === city);
  function submitReview(event) {
    event.preventDefault();
    if (!rating) {
      setMessage('Please choose a star rating before submitting.');
      return;
    }
    const review = {
      id: `review-${Date.now()}`,
      name: name.trim(),
      city: selectedCity,
      rating,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-GB'),
    };
    const updated = [review, ...reviews];
    try {
      localStorage.setItem('travelora-reviews', JSON.stringify(updated));
    } catch (error) {
      console.error('Unable to save travel review.', error);
      setMessage('Your review could not be saved on this device. Please try again.');
      return;
    }
    setReviews(updated);
    setCity('All destinations');
    setName('');
    setText('');
    setRating(0);
    setMessage('Thanks — your review has been added.');
  }
  return (
    <>
      <section className="catalog-hero reviews-hero"><div className="container"><span className="eyebrow">TRAVELLER STORIES</span><h1>Reviews</h1><p>Honest experiences and helpful tips from travellers exploring India.</p></div></section>
      <section className="catalog-section"><div className="container reviews-layout">
        <div className="review-list-wrap">
          <div className="review-filter-row"><h2>Community reviews</h2><label>Destination <select value={city} onChange={(event) => setCity(event.target.value)}><option>All destinations</option>{reviewCities.map((place) => <option key={place}>{place}</option>)}</select></label></div>
          <p className="catalog-count">{filtered.length} reviews</p>
          {filtered.length ? <div className="review-list">{filtered.map((review) => (
            <article className="review-card" key={review.id}><div className="review-card-top"><span className="review-avatar">{review.name.charAt(0).toUpperCase()}</span><div className="review-author"><b>{review.name}</b><small>{review.date}</small></div><div className="review-score"><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}<span>{'☆'.repeat(5 - review.rating)}</span></span><b>{review.rating.toFixed(1)}</b><small>{review.city}</small></div></div><p>{review.text}</p></article>
          ))}</div> : <div className="empty">No reviews for this destination yet. Be the first to share one.</div>}
        </div>
        <form className="review-form" onSubmit={submitReview}><h2>Write a Review</h2><p>Share your travel experience with the community.</p>
          <label htmlFor="review-name">Your name</label><input id="review-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required maxLength="60" />
          <label htmlFor="review-destination">Destination</label><select id="review-destination" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} required><option value="">Choose a destination</option>{reviewCities.map((place) => <option key={place}>{place}</option>)}</select>
          <span className="review-label">Your rating</span><div className="review-stars" role="group" aria-label="Your rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-label={`${value} stars`} aria-pressed={rating === value}>★</button>)}</div>
          <label htmlFor="review-text">Your review</label><textarea id="review-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Tell us about your trip..." required maxLength="1000" rows="5" />
          <button className="primary" type="submit">Submit Review</button>{message && <p className="review-message" role="status">{message}</p>}
        </form>
      </div></section>
    </>
  );
}

function About() {
  return (
    <>
      <section className="about-banner" aria-hidden="true" />
      <section className="about-page"><div className="container about-content">
        <div className="about-copy"><span className="eyebrow">THE MISSION</span><h1>Making travel information effortless</h1>
          <p>Travelora was created to make tourism information easy to discover, organize and access. We bring together destinations, attractions, hotels, transportation and guides into one elegant platform — so planning your journey across incredible India feels effortless.</p>
          <p>From the beaches of Goa to the heritage of Jaipur, the backwaters of Kerala to the hills of Manali — every record in our system is structured and connected. Explore places, compare stays, find transport and share your own experiences.</p>
          <div className="about-actions"><Link className="primary" to="/explore"><Compass size={16} /> Start Exploring</Link><Link className="secondary" to="/reviews">Read Reviews</Link></div>
        </div>
        <div className="about-visual" role="img" aria-label="The Indian tricolour flag in a clear blue sky"><div className="flag-pole" /><div className="india-flag"><span /><span /><span /><i /></div></div>
      </div></section>
    </>
  );
}

function Categories() {
  return (
    <>
      <div className="pagehead"><div className="container"><span className="eyebrow">TRAVEL YOUR WAY</span><h1>Travel guides</h1><p className="muted">Choose the kind of journey you want.</p></div></div>
      <section className="section"><div className="container"><div className="grid">{categories.filter((category) => category !== 'All').map((category) => (
        <Link to={`/explore?category=${encodeURIComponent(category)}`} className="card category-card" key={category}>
          <div className="cardbody"><span className="pill">{category}</span><h3>{category} escapes</h3><p className="muted">{destinations.filter((destination) => destination.category === category).length} destinations to explore.</p><span className="details">Explore <ArrowRight size={15} /></span></div>
        </Link>
      ))}</div></div></section>
    </>
  );
}

function GuideCard({ guide, userRating, onRate }) {
  const displayedRating = userRating ?? guide.rating;
  return (
    <article className="guide-card">
      <img className="guide-photo" src={guide.image} alt={guide.name} loading="lazy" />
      <div className="guide-content">
        <div className="guide-card-top">
          <h2>{guide.name}</h2>
          <div className="guide-rating-wrap">
            <span className="guide-rating-score"><span aria-hidden="true">★★★★★</span> {displayedRating.toFixed(1)}</span>
            <div className="guide-rating-input" role="group" aria-label={`Rate ${guide.name}`}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  className={rating <= (userRating || 0) ? 'selected' : ''}
                  type="button"
                  key={rating}
                  onClick={() => onRate(guide.id, rating)}
                  aria-label={`Rate ${guide.name} ${rating} ${rating === 1 ? 'star' : 'stars'}`}
                  aria-pressed={userRating === rating}
                  title={`${rating} out of 5`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="guide-rating-caption">{userRating ? 'Your rating' : 'Rate this guide'}</span>
          </div>
        </div>
        <div className="guide-location"><MapPin size={15} /> {guide.destination}</div>
        <p className="guide-description">{guide.description}</p>
        <div className="guide-meta">
          <span><Languages size={17} /> {guide.languages.join(', ')}</span>
          <span><BriefcaseBusiness size={16} /> {guide.experience} yrs exp</span>
        </div>
        <div className="guide-bottom">
          <div className="guide-rate"><strong>₹ {guide.rate}</strong><span>per day</span></div>
          <a
            className="guide-contact"
            href={`mailto:hello@travelora.in?subject=${encodeURIComponent(`Guide enquiry: ${guide.name}`)}&body=${encodeURIComponent(`Hello Travelora,\n\nI would like to enquire about ${guide.name}, a local guide in ${guide.destination}.\n\nPlease share the best way to contact this guide.`)}`}
          >
            <Phone size={16} /> Contact
          </a>
        </div>
      </div>
    </article>
  );
}

function Guides() {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [destination, setDestination] = useState('All destinations');
  const [language, setLanguage] = useState('All languages');
  const [userRatings, setUserRatings] = useState(readGuideRatings);
  const guideDestinations = [...new Set(guides.map((guide) => guide.destination))].sort();
  const guideLanguages = [...new Set(guides.flatMap((guide) => guide.languages))].sort();
  function rateGuide(guideId, rating) {
    const updatedRatings = { ...userRatings, [guideId]: rating };
    try {
      localStorage.setItem('travelora-guide-ratings', JSON.stringify(updatedRatings));
    } catch (error) {
      console.error('Unable to save guide rating.', error);
      return;
    }
    setUserRatings(updatedRatings);
  }
  const filteredGuides = guides.filter((guide) => {
    const matchesDestination = destination === 'All destinations' || guide.destination === destination;
    const matchesLanguage = language === 'All languages' || guide.languages.includes(language);
    const searchable = `${guide.name} ${guide.destination} ${guide.description} ${guide.languages.join(' ')}`.toLowerCase();
    return matchesDestination && matchesLanguage && searchable.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <section className="guides-hero">
        <div className="container">
          <span className="eyebrow">LOCAL EXPERTS</span>
          <h1>Tourist Guides</h1>
          <p>Experienced local guides who speak your language and know every corner of your destination.</p>
        </div>
      </section>
      <section className="guides-section">
        <div className="container">
          <div className="guide-search-row">
            <label className="guide-search">
              <Search size={19} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides..."
                aria-label="Search guides"
              />
            </label>
            <button
              className={`guide-filter-button${filtersOpen ? ' is-open' : ''}`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="guide-filters"
            >
              <SlidersHorizontal size={17} /> Filters
            </button>
          </div>
          {filtersOpen && (
            <div className="guide-filters" id="guide-filters">
              <label>
                Destination
                <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                  <option>All destinations</option>
                  {guideDestinations.map((place) => <option key={place}>{place}</option>)}
                </select>
              </label>
              <label>
                Language
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option>All languages</option>
                  {guideLanguages.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {(destination !== 'All destinations' || language !== 'All languages' || query) && (
                <button className="guide-clear" onClick={() => { setQuery(''); setDestination('All destinations'); setLanguage('All languages'); }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
          <p className="guide-result-count">{filteredGuides.length} {filteredGuides.length === 1 ? 'guide' : 'guides'} found</p>
          {filteredGuides.length ? (
            <div className="guides-grid">{filteredGuides.map((guide) => (
              <GuideCard guide={guide} userRating={userRatings[guide.id]} onRate={rateGuide} key={guide.id} />
            ))}</div>
          ) : (
            <div className="empty guide-empty">No guides match your search. Try another name, destination, or language.</div>
          )}
        </div>
      </section>
    </>
  );
}

function Destination() {
  const id = Number(useLocation().pathname.split('/').pop());
  const destination = destinations.find((place) => place.id === id);
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('travelora-favorites') || '[]').includes(id);
    } catch (error) {
      console.error('Unable to read saved destinations.', error);
      return false;
    }
  });
  if (!destination) return <NotFound />;

  function toggleSaved() {
    let favorites;
    try {
      favorites = JSON.parse(localStorage.getItem('travelora-favorites') || '[]');
    } catch (error) {
      console.error('Unable to update saved destinations.', error);
      return;
    }
    const updated = saved ? favorites.filter((item) => item !== id) : [...new Set([...favorites, id])];
    localStorage.setItem('travelora-favorites', JSON.stringify(updated));
    setSaved(!saved);
  }

  return (
    <section className="detail"><div className="container">
      <div className="detailhero"><img src={destination.image} alt={destination.name} /><div>
        <span className="pill">{destination.category}</span><h1>{destination.name}</h1>
        <div className="muted location"><MapPin size={15} /> {destination.location} <span className="rating"><Star size={14} fill="currentColor" /> {destination.rating}</span></div>
        <p className="muted">{destination.description}</p>
        <Link className="primary" to="/planner">Add to trip</Link>
        <button className="secondary" onClick={toggleSaved}><Heart size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}</button>
      </div></div>
      <div className="section"><h2>About {destination.name}</h2><p className="muted">{destination.description} Ask Travelora AI for ideas to help shape a trip around this destination.</p></div>
    </div></section>
  );
}

function Planner() {
  const params = new URLSearchParams(useLocation().search);
  const requestedPlace = params.get('destination') || '';
  const requestedDestination = destinations.find((place) => place.name.toLowerCase() === requestedPlace.toLowerCase());
  const requestedRoute = params.get('route') || '';
  const [itinerary, setItinerary] = useState('');
  const [destinationId, setDestinationId] = useState(requestedDestination ? String(requestedDestination.id) : '');
  const [days, setDays] = useState('3');
  const [style, setStyle] = useState('Balanced');

  function generateItinerary(event) {
    event.preventDefault();
    const destination = destinations.find((place) => place.id === Number(destinationId));
    if (!destination) return;
    const dayCount = Math.min(Math.max(Number(days) || 1, 1), 7);
    const result = makeItinerary(destination, dayCount);
    setItinerary(`${result}\n\nTravel style: ${style}.${requestedRoute ? `\n\nSuggested transport: ${requestedRoute}.` : ''}`);
  }

  return (
    <>
      <div className="pagehead"><div className="container"><span className="eyebrow">PLAN YOUR JOURNEY</span><h1>Trip Planner</h1><p className="muted">Start with your destination and preferences.</p></div></div>
      <div className="container"><form className="form" onSubmit={generateItinerary}>
        {(requestedPlace || requestedRoute) && <p className="planner-context">{requestedPlace ? `Stay selected for ${requestedPlace}.` : ''}{requestedRoute ? ` Suggested route: ${requestedRoute}.` : ''}</p>}
        <label htmlFor="plan-destination">Destination</label><select id="plan-destination" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required><option value="">Select a destination</option>{destinations.map((destination) => <option value={destination.id} key={destination.id}>{destination.name}</option>)}</select>
        <label htmlFor="plan-days">Number of days</label><input id="plan-days" type="number" min="1" max="7" value={days} onChange={(event) => setDays(event.target.value)} required />
        <label htmlFor="plan-style">Travel style</label><select id="plan-style" value={style} onChange={(event) => setStyle(event.target.value)}><option>Balanced</option><option>Adventure</option><option>Relaxed</option><option>Heritage</option></select>
        <button className="primary" type="submit">Generate itinerary</button>
        {itinerary && <div className="itinerary-result" aria-live="polite"><h2>Your trip outline</h2><p>{itinerary}</p></div>}
      </form></div>
    </>
  );
}

function Favorites() {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('travelora-favorites') || '[]');
  } catch (error) {
    console.error('Unable to read saved destinations.', error);
  }
  const savedPlaces = saved.map((id) => destinations.find((destination) => destination.id === id)).filter(Boolean);
  return (
    <>
      <div className="pagehead"><div className="container"><span className="eyebrow">YOUR LIST</span><h1>Favorites</h1></div></div>
      <section className="section"><div className="container">{savedPlaces.length ? <div className="grid">{savedPlaces.map((destination) => <Card destination={destination} key={destination.id} />)}</div> : <div className="empty">Your saved destinations will appear here.</div>}</div></section>
    </>
  );
}

function AuthForm({ register = false }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim().toLowerCase();
    const name = String(form.get('name') || '').trim();
    try {
      localStorage.setItem('travelora-profile', JSON.stringify({ email, name: name || email.split('@')[0] }));
      setMessage(register ? 'Your Travelora profile is ready on this device.' : 'You are signed in on this device.');
      window.setTimeout(() => navigate('/explore'), 700);
    } catch (error) {
      console.error('Unable to save Travelora profile.', error);
      setMessage('We could not save your profile on this device. Please check browser storage and try again.');
    }
  }
  return <div className="container auth-page"><form className="form" onSubmit={submit}>
    <span className="eyebrow">WELCOME TO TRAVELORA</span><h2>{register ? 'Create your account' : 'Sign in to Travelora'}</h2>
    {register && <><label htmlFor="register-name">Name</label><input id="register-name" name="name" type="text" placeholder="Your name" autoComplete="name" required maxLength="60" /></>}
    <label htmlFor={`${register ? 'register' : 'login'}-email`}>Email</label><input id={`${register ? 'register' : 'login'}-email`} name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
    <label htmlFor={`${register ? 'register' : 'login'}-password`}>Password</label><input id={`${register ? 'register' : 'login'}-password`} name="password" type="password" placeholder="At least 8 characters" autoComplete={register ? 'new-password' : 'current-password'} minLength="8" required />
    <button className="primary" type="submit">{register ? 'Create account' : 'Sign in'}</button>
    {message && <p className="form-note" role="status">{message}</p>}
    <p className="form-note">This demo stores your profile in this browser only; no password is saved or sent to a server.</p>
    <p className="auth-switch">{register ? 'Already have an account?' : 'New to Travelora?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
  </form></div>;
}

function Login() {
  return <AuthForm />;
}

function Register() {
  return <AuthForm register />;
}

function NotFound() {
  return <div className="container"><div className="empty not-found"><h2>404 — Page not found</h2><Link className="primary" to="/">Return home</Link></div></div>;
}

function App() {
  const pathname = useLocation().pathname;
  let page = <NotFound />;
  if (pathname === '/') page = <Home />;
  else if (pathname === '/explore') page = <Explore />;
  else if (pathname === '/attractions') page = <Attractions />;
  else if (pathname === '/hotels') page = <Hotels />;
  else if (pathname.startsWith('/booking/')) page = <Booking />;
  else if (pathname === '/transport') page = <Transport />;
  else if (pathname === '/reviews') page = <Reviews />;
  else if (pathname === '/about') page = <About />;
  else if (pathname === '/categories') page = <Categories />;
  else if (pathname === '/guides') page = <Guides />;
  else if (pathname === '/planner') page = <Planner />;
  else if (pathname === '/favorites') page = <Favorites />;
  else if (pathname === '/login') page = <Login />;
  else if (pathname === '/register') page = <Register />;
  else if (pathname.startsWith('/destination/')) page = <Destination />;
  return (
    <>
      <Header />
      <main>{page}</main>
      <Chat />
      <footer className="footer" id="about">
        <div className="container footer-grid">
          <div className="footer-about">
            <Link className="brand footer-brand" to="/">
              <span className="brandmark"><Compass size={21} /></span>
              <span><b className="logo">Travelora</b><small>EXPLORE · PLAN · EXPERIENCE</small></span>
            </Link>
            <p>Tourism Information Retrieval System. Discover destinations, explore attractions, find hotels and plan your journey across incredible India.</p>
            <em>“Explore. Plan. Experience.”</em>
          </div>
          <div className="footer-column">
            <h3>EXPLORE</h3>
            <Link to="/explore">Destinations</Link>
            <Link to="/attractions">Attractions</Link>
            <Link to="/hotels">Hotels</Link>
            <Link to="/transport">Transportation</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/guides">Tourist Guides</Link>
            <Link to="/about">About</Link>
          </div>
          <div className="footer-column">
            <h3>SUPPORT</h3>
            <a href="mailto:hello@travelora.in">Contact</a>
            <Link to="/planner">Trip planner</Link>
            <a href="#about">Privacy</a>
            <a href="#about">Terms</a>
          </div>
          <div className="footer-column footer-contact">
            <h3>GET IN TOUCH</h3>
            <a href="mailto:hello@travelora.in">hello@travelora.in</a>
            <a href="tel:+9118001234567">+91 1800 123 4567</a>
            <span>New Delhi, India</span>
            <span className="footer-ai"><span>🌐</span> Travelora AI</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Travelora · Tourism Information Retrieval System</span>
          <span>Crafted with care for travellers across India</span>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}><App /></BrowserRouter>);
