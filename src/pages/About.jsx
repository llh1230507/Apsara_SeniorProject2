// src/pages/About.jsx
export default function About() {
  return (
    <div className="bg-white text-gray-800">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-3xl font-bold">About Us</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
          Learn about Apsara, our mission, and the people behind every
          handcrafted piece.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-20 space-y-20">
        {/* Row 1: Text left, Image right */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              At Apsara, we believe in the power of handcrafted art. Each piece
              we create is made by skilled artisans who dedicate their craft to
              producing sculptures of exceptional quality. Our work reflects
              timeless artistry, cultural depth, and a commitment to preserving
              traditional techniques.
              <br />
              <br />
              We believe art is the bridge between the past and the future. By
              supporting local craftsmanship, we help ensure these time-honoured
              techniques are passed down through generations—keeping the spirit
              of Apsara alive in every carving.
            </p>
          </div>

          <div className="w-full">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border">
              <img
                src="/banner.jpg"
                alt="Apsara handcrafted collection"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </section>

        {/* Row 2: Image left, Text right */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 w-full">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border">
              <img
                src="/product2.jpg"
                alt="Handcrafted sculpture"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-xl font-semibold mb-3">What We Do</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              We specialize in custom and ready-made sculptures carved from
              wood, stone, and metal. From traditional figures to modern art
              pieces and personalized designs, our goal is to bring your vision
              to life with precision and passion.
              <br />
              <br />
              Each item is crafted with attention to detail and quality, making
              it meaningful for gifts, collections, or home décor—rooted in
              tradition and adapted for contemporary spaces.
            </p>
          </div>
        </section>

        {/* Row 3: Text left, Image right — The People */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl font-semibold mb-3">
              The People Behind the Work
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              Our team is made up of passionate artisans, designers, and
              craftspeople who bring years of experience and dedication to every
              project. From the first sketch to the final polish, each member
              plays a vital role in shaping the pieces you love.
              <br />
              <br />
              We are a small, close-knit group who share a deep pride in what we
              do. Every sculpture we create carries a part of our story—made by
              hand, with heart.
            </p>
          </div>

          <div className="w-full">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border">
              <img
                src="/picture1.jpg"
                alt="The team behind Apsara"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
