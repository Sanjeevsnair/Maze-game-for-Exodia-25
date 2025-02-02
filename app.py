from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

# Store player results in a list (use a database in production)
results = {
    "eliminated": [],
    "escaped": []
}

def find_player(player_name, player_number):
    """ Check if player exists in either list """
    for player in results["eliminated"]:
        if player["playerName"] == player_name and player["playerNumber"] == player_number:
            return player, "eliminated"
    
    for player in results["escaped"]:
        if player["playerName"] == player_name and player["playerNumber"] == player_number:
            return player, "escaped"

    return None, None

@app.route('/register-player', methods=['POST'])
def register_player():
    """ Register a new player if they are not already in the results list """
    data = request.json
    player_name = data.get("playerName")
    player_number = data.get("playerNumber")

    existing_player, category = find_player(player_name, player_number)

    if existing_player:
        return jsonify({"message": "Player already registered", "data": existing_player, "status": "exists"})
    
    # New player - add to "eliminated" with escaped=False
    new_player = {
        "escaped": False,
        "playerName": player_name,
        "playerNumber": player_number,
        "timeRemaining": 0
    }
    results["eliminated"].append(new_player)

    return jsonify({"message": "Player registered successfully", "data": new_player, "status": "new"})

@app.route('/submit-result', methods=['POST'])
def submit_result():
    """ Update the player's escape status if they win """
    data = request.json
    player_name = data.get("playerName")
    player_number = data.get("playerNumber")
    time_remaining = data.get("timeRemaining")
    escaped = data.get("escaped")

    existing_player, category = find_player(player_name, player_number)

    if existing_player:
        if escaped:
            # Move player to the "escaped" list
            results["eliminated"].remove(existing_player)
            existing_player["escaped"] = True
            existing_player["timeRemaining"] = time_remaining
            results["escaped"].append(existing_player)
        return jsonify({"message": "Player status updated", "data": existing_player})
    
    return jsonify({"error": "Player not found"}), 400


@app.route('/check-player', methods=['POST'])
def check_player():
    data = request.json
    player_name = data.get("playerName")
    player_number = data.get("playerNumber")

    existing_player, category = find_player(player_name, player_number)

    if existing_player:
        # Player exists and has a previous game status
        if category == "escaped":
            return jsonify({"exists": True, "message": f"Welcome back, You have already played the game. Thank you!"})
        else:
            return jsonify({"exists": True, "message": f"Welcome back, You have already played the game. Thank you!"})
    else:
        # New player
        return jsonify({"exists": False, "message": f"Welcome, {player_name}! You are now registered."})



@app.route('/get-results', methods=['GET'])
def get_results():
    escaped_players = escaped_players = [r for r in results["escaped"] if r["escaped"]]
    eliminated_players = [r for r in results["eliminated"] if not r["escaped"]]

    return jsonify({
        "escaped": escaped_players,
        "eliminated": eliminated_players,
    })

if __name__ == '__main__':
    app.run(debug=True)