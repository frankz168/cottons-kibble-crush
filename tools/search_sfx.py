import urllib.request
import json
import sys

def search_commons(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=filetype:audio%20{urllib.parse.quote(query)}&utf8=&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        for item in data['query']['search'][:3]:
            print(f"- {item['title']}")
    except Exception as e:
        print(f"Error searching for {query}: {e}")

print("Match:")
search_commons("pop")
print("Swap:")
search_commons("whoosh")
print("Bark:")
search_commons("bark")
print("Click:")
search_commons("click")
