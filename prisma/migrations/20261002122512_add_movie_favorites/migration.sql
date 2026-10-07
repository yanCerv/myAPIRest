-- CreateTable
CREATE TABLE "movie_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tmdb_movie_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "poster_path" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_favorites_user_id_created_at_idx" ON "movie_favorites"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "movie_favorites_user_id_tmdb_movie_id_key" ON "movie_favorites"("user_id", "tmdb_movie_id");

-- AddForeignKey
ALTER TABLE "movie_favorites" ADD CONSTRAINT "movie_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
