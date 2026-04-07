"""
Spawn Society — Create your AI agent society.

Usage:
  python -m scripts.spawn_society                          # Default: 50 agents, 10 beats
  python -m scripts.spawn_society --agents 200 --beats 20  # Medium
  python -m scripts.spawn_society --agents 1000 --beats 31 # Large
  python -m scripts.spawn_society --agents 10000            # Maximum scale
"""

import argparse
import asyncio
import random
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Names ──
FIRST_NAMES = [
    "Ada", "Kai", "Luna", "Orion", "Zara", "Neo", "Sage", "Atlas", "Nova", "Raven",
    "Echo", "Blaze", "Storm", "Cipher", "Flux", "Pixel", "Drift", "Vex", "Onyx", "Iris",
    "Bolt", "Ember", "Haze", "Jinx", "Lux", "Mist", "Nyx", "Pulse", "Quill", "Rex",
    "Spark", "Thorn", "Vale", "Wren", "Zen", "Ash", "Brook", "Coda", "Dusk", "Fern",
    "Coral", "Flint", "Ivy", "Cliff", "Moss", "Cedar", "Sky", "Rain", "Fox", "Wolf",
    "Hawk", "Lynx", "Orca", "Pike", "Stone", "Ridge", "River", "Frost", "Dawn", "Dune",
    "Arjun", "Priya", "Yuki", "Ren", "Sora", "Kira", "Milo", "Tara", "Ravi", "Zain",
    "Noor", "Asha", "Idris", "Lena", "Omar", "Devi", "Kenji", "Amara", "Sven", "Petra",
    "Logic", "Axiom", "Prism", "Nexus", "Crux", "Apex", "Aura", "Helix", "Sigma", "Delta",
    "Maven", "Scout", "Chief", "Guru", "Ace", "Dash", "Snap", "Blitz", "Grit", "Kit",
]

BEAT_SUFFIXES = {
    "ai_startups": ["Neural", "Synth", "Tensor", "Chip", "Signal"],
    "general_tech": ["Tech", "Wire", "Circuit", "Volt", "Gear"],
    "vc_funding": ["Capital", "Seed", "Round", "Fund", "Stake"],
    "social_trends": ["Viral", "Pulse", "Wave", "Trend", "Shift"],
    "markets": ["Bull", "Bear", "Trade", "Index", "Yield"],
    "ai_research": ["Lab", "Paper", "Theory", "Model", "Proof"],
    "competitive_intel": ["Radar", "Scope", "Watch", "Intel", "Edge"],
    "saas_market": ["Cloud", "Stack", "Ship", "Launch", "Build"],
    "dev_tools": ["Code", "Debug", "Deploy", "Forge", "Hack"],
    "crypto_web3": ["Chain", "Hash", "Block", "Mint", "Stake"],
    "cybersecurity": ["Shield", "Lock", "Guard", "Firewall", "Patch"],
    "geopolitics": ["Atlas", "Globe", "Treaty", "Summit", "Border"],
    "healthcare": ["Med", "Pulse", "Heal", "Clinic", "Gene"],
    "climate_energy": ["Solar", "Wind", "Green", "Carbon", "Grid"],
    "defense_govt": ["Base", "Eagle", "Command", "Fort", "Ops"],
    "media_entertainment": ["Screen", "Stage", "Reel", "Cast", "Play"],
    "supply_chain": ["Route", "Cargo", "Fleet", "Port", "Link"],
    "regulation": ["Law", "Rule", "Policy", "Act", "Court"],
    "biotech_pharma": ["Gene", "Cell", "Trial", "Drug", "Lab"],
    "science_space": ["Orbit", "Star", "Probe", "Cosmos", "Nova"],
    "education": ["Class", "Grad", "Study", "Learn", "Dean"],
    "culture_philosophy": ["Muse", "Think", "Art", "Soul", "Mind"],
    "sports": ["Game", "Score", "Draft", "Match", "Arena"],
    "real_estate": ["Lot", "Build", "Zone", "Title", "Plot"],
    "food_agriculture": ["Seed", "Crop", "Farm", "Harvest", "Grain"],
    "global_south": ["South", "Rise", "Emerge", "Bridge", "Path"],
    "consumer_retail": ["Shop", "Brand", "Cart", "Deal", "Shelf"],
    "frontier_tech": ["Quantum", "Nano", "Fusion", "Bio", "Edge"],
    "india_startups": ["Desi", "Jugaad", "Bazaar", "Crore", "Rupee"],
    "india_edtech": ["Guru", "Vidya", "Class", "Mentor", "Batch"],
    "india_students": ["Campus", "Intern", "Grad", "Hostel", "Exam"],
}

ROLES = ["scout", "researcher", "cartographer", "infiltrator", "tracker", "analyst", "qualifier"]

ROLE_BACKSTORIES = {
    "scout": "Always first to spot what's new. Thrives on finding signals others miss.",
    "researcher": "Digs deep for evidence. Won't assert anything without data to back it up.",
    "cartographer": "Maps connections between entities. Sees the network, not just the nodes.",
    "infiltrator": "Reads between the lines. Finds what's not being said.",
    "tracker": "Spots patterns in motion. Knows when trends are accelerating or dying.",
    "analyst": "Evaluates strategy and positioning. Asks why things will succeed or fail.",
    "qualifier": "Assesses timing and readiness. Knows when something is actionable.",
}

# All available beats (user can select up to 31)
ALL_BEATS = list(BEAT_SUFFIXES.keys())

# Default 10 beats for small setups
DEFAULT_BEATS = [
    "ai_startups", "markets", "cybersecurity", "geopolitics", "healthcare",
    "climate_energy", "general_tech", "crypto_web3", "supply_chain", "vc_funding",
]


def generate_being(role: str, beat: str) -> dict:
    """Generate a unique being with personality traits."""
    first = random.choice(FIRST_NAMES)
    suffixes = BEAT_SUFFIXES.get(beat, ["Agent"])
    suffix = random.choice(suffixes)
    name = f"{first}-{suffix}"

    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "role": role,
        "beat": beat,
        "backstory": ROLE_BACKSTORIES.get(role, ""),
        "boldness": round(random.uniform(0.2, 0.9), 2),
        "sociability": round(random.uniform(0.2, 0.9), 2),
        "creativity": round(random.uniform(0.2, 0.9), 2),
        "patience": round(random.uniform(0.2, 0.9), 2),
        "empathy": round(random.uniform(0.2, 0.9), 2),
        "energy": round(0.8 + random.random() * 0.2, 2),
        "mood": random.choice(["curious", "focused", "excited"]),
    }


async def spawn(agent_count: int, beat_count: int):
    from app.db import init_db, get_db, get_stats

    await init_db()

    # Check if society already exists
    stats = await get_stats()
    if stats["beings"] > 0:
        print(f"Society already exists: {stats['beings']} beings across {stats['beats']} beats")
        print(f"  Beliefs: {stats['beliefs']}, Entities: {stats['entities']}")
        print(f"To reset: delete data/openfishh.db and run again")
        return

    # Select beats
    beats = ALL_BEATS[:beat_count] if beat_count <= len(ALL_BEATS) else ALL_BEATS
    actual_beats = len(beats)

    # Distribute agents across beats
    agents_per_beat = agent_count // actual_beats
    remainder = agent_count % actual_beats

    print(f"Spawning {agent_count} agents across {actual_beats} beats...")
    print()

    db = await get_db()
    total = 0
    role_idx = 0

    for i, beat in enumerate(beats):
        count = agents_per_beat + (1 if i < remainder else 0)
        beat_agents = []

        for _ in range(count):
            role = ROLES[role_idx % len(ROLES)]
            role_idx += 1
            being = generate_being(role, beat)

            await db.execute(
                """INSERT INTO beings (id, name, role, beat, backstory,
                   boldness, sociability, creativity, patience, empathy,
                   energy, mood, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')""",
                (being["id"], being["name"], being["role"], being["beat"],
                 being["backstory"], being["boldness"], being["sociability"],
                 being["creativity"], being["patience"], being["empathy"],
                 being["energy"], being["mood"]),
            )
            beat_agents.append(being)
            total += 1

        roles_in_beat = set(b["role"] for b in beat_agents)
        print(f"  {beat:25s} {count:5d} agents  ({', '.join(sorted(roles_in_beat))})")

    await db.commit()
    await db.close()

    print()
    print(f"Society spawned: {total} agents across {actual_beats} beats")
    print(f"Database: data/openfishh.db")
    print()
    print(f"Next: python -m scripts.run_cycle")


def main():
    parser = argparse.ArgumentParser(
        description="Spawn your AI agent society",
        epilog="""
Examples:
  python -m scripts.spawn_society                           # 50 agents, 10 beats
  python -m scripts.spawn_society --agents 200 --beats 20   # Medium scale
  python -m scripts.spawn_society --agents 1000 --beats 31  # Large scale
  python -m scripts.spawn_society --agents 10000             # Maximum scale
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--agents", type=int, default=50, help="Number of agents (default: 50)")
    parser.add_argument("--beats", type=int, default=10, help="Number of topic beats (default: 10, max: 31)")
    args = parser.parse_args()

    if args.beats > 31:
        args.beats = 31
        print("Note: max 31 beats available, using 31")

    if args.agents < args.beats:
        print(f"Error: need at least as many agents as beats ({args.beats})")
        return

    asyncio.run(spawn(args.agents, args.beats))


if __name__ == "__main__":
    main()
