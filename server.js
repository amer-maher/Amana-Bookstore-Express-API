import express from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import books from './data/books.json' with { type: 'json' };
import reviews from './data/reviews.json' with { type: 'json' };

const allBooks = books.books;  
const allReviews = reviews.reviews; 

const app = express();
const PORT = process.env.PORT || 3000;
const logStream = fs.createWriteStream(path.join('./logging', 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(express.json());
app.use(morgan('dev'));


app.get('/books', (req, res) => {
  res.json(allBooks);
});

/* 🟢 4️⃣  أفضل 10 كتب مقيمة (التقييم × عدد المراجعات) */
app.get('/books/best', (req, res) => {
  const best10Books = [...allBooks]
    .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
    .slice(0, 10);

  res.json(best10Books);
});

app.get('/books/:id', (req, res) => {
  const { id } = req.params;
  const book = allBooks.find(b => b.id.toString() === id);
  book
    ? res.json(book)
    : res.status(404).json({ message: 'Book not found' });
});

/*  */
app.get('/books/range/:start/:end', (req, res) => {
  const { start, end } = req.params;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const booksInRange = allBooks.filter(b => {
    const pubDate = new Date(b.datePublished);
    return pubDate >= startDate && pubDate <= endDate;
  });

  booksInRange.length > 0
    ? res.json(booksInRange)
    : res.status(404).json({ message: 'No books found in this date range' });
});

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* 🟢 5️⃣  الكتب التي تحمل علامة المميز (featured = true) */
app.get('/books/featured', (req, res) => {
  const featuredBooks = allBooks.filter(b => b.featured === true);
  featuredBooks.length > 0
    ? res.json(featuredBooks)
    : res.status(404).json({ message: 'No featured books found' });
});

/* -------------------------------------------------------------------------- */
/* 🟢 6️⃣  جميع المراجعات الخاصة بكتاب محدد */
app.get('/books/:id/reviews', (req, res) => {
  const { id } = req.params;
  const book = allBooks.find(b => b.id.toString() === id);

  if (!book)
    return res.status(404).json({ message: 'Book not found' });

  const bookReviews = allReviews.filter(r => r.bookId.toString() === id);
  bookReviews.length > 0
    ? res.json(bookReviews)
    : res.status(404).json({ message: 'No reviews found for this book' });
});
/* -------------------------------------------------------------------------- */
/* 🟢 7️⃣  إضافة كتاب جديد إلى المكتبة */
// middleware to control and log the book data
//add new book
function acssessControl(req, res, next) {
  if(req.body.roll === "admin"){
    console.log("admin access granted")
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
  return;
}

app.post('/books', acssessControl,(req, res) => {
  const newBook = req.body;
  if (!newBook || !newBook.title || !newBook.author || !newBook.id) {
    return res.status(400).json({ message: 'Invalid book data' });
  }
  allBooks.push(newBook);
  res.status(201).json(newBook);
});


/* -------------------------------------------------------------------------- */
// 🚀 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
