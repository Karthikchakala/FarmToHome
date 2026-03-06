import React, { useState, useEffect } from 'react';
import { fetchHomeConfig } from './homeAPI.js';
import './QuotesSection.css';

const FALLBACK_QUOTES = [
    { text: "The nations that destroy their soil destroy themselves.", author: "Franklin D. Roosevelt" },
    { text: "To forget how to dig the earth and to tend the soil is to forget ourselves.", author: "Mahatma Gandhi" },
    { text: "Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals, and happiness.", author: "Thomas Jefferson" },
    { text: "The ultimate goal of farming is not the growing of crops, but the cultivation and perfection of human beings.", author: "Masanobu Fukuoka" },
    { text: "Farming is a profession of hope.", author: "Brian Brett" },
];

const QuotesSection = () => {
    const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        fetchHomeConfig()
            .then(config => { if (config?.quotes?.length > 0) setQuotes(config.quotes); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrent(c => (c + 1) % quotes.length), 5000);
        return () => clearInterval(timer);
    }, [quotes]);

    const q = quotes[current];

    return (
        <section className="quotes" aria-label="Agriculture quotes">
            <div className="quotes__container">
                <div className="quotes__icon" aria-hidden="true">"</div>
                <blockquote className="quotes__text" key={current}>
                    {q.text}
                </blockquote>
                <cite className="quotes__author">— {q.author}</cite>
                <div className="quotes__dots">
                    {quotes.map((_, i) => (
                        <button
                            key={i}
                            className={`quotes__dot${i === current ? ' quotes__dot--active' : ''}`}
                            onClick={() => setCurrent(i)}
                            aria-label={`Quote ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuotesSection;
