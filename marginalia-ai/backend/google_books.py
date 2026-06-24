import os
import requests

def search_books(query: str):
    api_key = os.getenv("GOOGLE_BOOKS_API_KEY")
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=5"
    if api_key:
        url += f"&key={api_key}"
        
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        results = []
        if "items" in data:
            for item in data["items"]:
                volume_info = item.get("volumeInfo", {})
                
                # Extract best available data
                title = volume_info.get("title", "Unknown Title")
                authors = volume_info.get("authors", ["Unknown Author"])
                author = authors[0] if authors else "Unknown Author"
                page_count = volume_info.get("pageCount", 0)
                
                # Identify ISBN-13 if available
                isbn = None
                identifiers = volume_info.get("industryIdentifiers", [])
                for id_obj in identifiers:
                    if id_obj.get("type") == "ISBN_13":
                        isbn = id_obj.get("identifier")
                        break
                        
                # Get high-res cover if possible, fallback to thumbnail
                image_links = volume_info.get("imageLinks", {})
                cover_url = image_links.get("thumbnail", "")
                # Replace http with https to avoid mixed content warnings on frontend
                if cover_url.startswith("http://"):
                    cover_url = cover_url.replace("http://", "https://")
                    
                results.append({
                    "title": title,
                    "author": author,
                    "isbn": isbn,
                    "total_pages": page_count,
                    "cover_image_url": cover_url
                })
        return results
    except Exception as e:
        print(f"Error fetching from Google Books: {e}")
        return []
